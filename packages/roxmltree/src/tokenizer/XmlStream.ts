import { StrSpan } from './StrSpan';
import { type TRange, type TReference, type TTextPos } from './types';
import { isAsciiDigit, isXmlChar, isXmlName, isXmlNameStart, isXmlSpaceByte } from './utils';
import { XmlError } from './XMLError';

/**
 * Represents a stream of characters for parsing XML-like content.
 */
export class XmlStream {
	private _span: StrSpan;
	private _pos: number;
	private _end: number;

	public constructor(span: StrSpan, pos = 0) {
		this._span = span;
		this._pos = pos;
		this._end = this._span.length;
	}

	public static fromString(text: string, pos = 0): XmlStream {
		return new XmlStream(StrSpan.fromString(text), pos);
	}

	public clone(): XmlStream {
		return new XmlStream(this._span.clone(), this._pos);
	}

	/**
	 * Gets the current position in the stream.
	 * @returns The current position.
	 */
	public getPos(): number {
		return this._pos;
	}

	/**
	 * Checks if the stream is at the end.
	 * @returns True if at the end, false otherwise.
	 */
	public atEnd(): boolean {
		return this._pos >= this._end;
	}

	/**
	 * Gets the current byte (character code) in the stream.
	 * @returns The current byte or null if at the end.
	 */
	public currByte(): number {
		if (this.atEnd()) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return this.currByteUnchecked();
	}

	/**
	 * Gets the current byte (character code) without checking for the end.
	 * @returns The current byte.
	 */
	public currByteUnchecked(): number {
		return this._span.getByte(this._pos);
	}

	/**
	 * Gets the next byte (character code) in the stream.
	 * @returns The next byte or null if at the end.
	 */
	public nextByte(): number {
		if (this._pos + 1 >= this._end) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return this._span.getByte(this._pos + 1);
	}

	/**
	 * Advances the stream position by n characters.
	 * @param n - The number of characters to advance.
	 */
	public advance(n: number): void {
		this._pos = Math.min(this._pos + n, this._end);
	}

	/**
	 * Checks if the stream starts with the given text.
	 * @param text - The text to check.
	 * @returns True if the stream starts with the text, false otherwise.
	 */
	public startsWith(text: string): boolean {
		return this._span.startsWith(text, this._pos);
	}

	/**
	 * Consumes a specific byte (character) from the stream.
	 * @param c - The byte to consume.
	 * @throws Error if the current byte doesn't match or if at the end.
	 */
	public consumeByte(c: number): void {
		const curr = this.currByte();
		if (curr !== c) {
			throw new XmlError({ type: 'InvalidChar', expected: c, actual: curr }, this.genTextPos());
		}
		this.advance(1);
	}

	/**
	 * Tries to consume a specific byte (character) from the stream.
	 * Unlike `consumeByte()` will not return any errors.
	 * @param c - The byte to consume.
	 * @returns True if the byte was consumed, false otherwise.
	 */
	public tryConsumeByte(c: number): boolean {
		const curr = this.currByte();
		if (curr === c) {
			this.advance(1);
			return true;
		}
		return false;
	}

	/**
	 * Skips a specific string in the stream.
	 * @param text - The string to skip.
	 * @throws Error if the stream doesn't start with the given string.
	 */
	public skipString(text: string): void {
		if (!this.startsWith(text)) {
			throw new XmlError({ type: 'InvalidString', expected: text }, this.genTextPos());
		}
		this.advance(text.length);
	}

	/**
	 * Consumes bytes that satisfy a predicate function.
	 * @param predicate - The function to test each byte.
	 * @returns The consumed string.
	 */
	public consumeBytes(predicate: (byte: number) => boolean): string {
		const start = this._pos;
		this.skipBytes(predicate);
		return this.sliceBack(start);
	}

	/**
	 * Skips bytes that satisfy a predicate function.
	 * @param predicate - The function to test each byte.
	 */
	public skipBytes(predicate: (byte: number) => boolean): void {
		while (!this.atEnd() && predicate(this.currByteUnchecked())) {
			this.advance(1);
		}
	}

	/**
	 * Consumes characters that satisfy a predicate function.
	 * @param predicate - The function to test each character.
	 * @returns The consumed string.
	 * @throws Error if a non-XML character is encountered.
	 */
	public consumeChars(predicate: (stream: XmlStream, char: string) => boolean): string {
		const start = this._pos;
		this.skipChars(predicate);
		return this.sliceBack(start);
	}

	/**
	 * Skips characters that satisfy a predicate function.
	 * @param predicate - The function to test each character.
	 * @throws Error if a non-XML character is encountered.
	 */
	public skipChars(predicate: (stream: XmlStream, char: string) => boolean): void {
		for (const charByte of this.charBytes()) {
			const char = String.fromCharCode(charByte);
			if (!isXmlChar(char)) {
				throw new XmlError({ type: 'NonXmlChar', char }, this.genTextPos());
			} else if (predicate(this, char)) {
				this.advance(char.length);
			} else {
				break;
			}
		}
	}

	/**
	 * Returns an iterator over the remaining characters in the stream.
	 * @returns An iterator of characters.
	 */
	public *charBytes(): IterableIterator<number> {
		for (let i = this._pos; i < Math.min(this._end, this._span.length); i++) {
			yield this._span.getByte(i);
		}
	}

	/**
	 * Slices the text from the given position to the current position.
	 * @param pos - The start position.
	 * @returns The sliced string.
	 */
	public sliceBack(pos: number): string {
		return this._span.sliceRegion(pos, this._pos);
	}

	public sliceBackSpan(pos: number): StrSpan {
		return StrSpan.fromSubBytes(this._span.bytes, pos, this._pos);
	}

	public rangeFrom(start: number): TRange {
		return [start, this._pos];
	}

	/**
	 * Skips whitespace characters in the stream.
	 */
	public skipSpaces(): void {
		while (this.startsWithSpace()) {
			this.advance(1);
		}
	}

	/**
	 * Checks if the stream starts with a whitespace character.
	 * @returns True if it starts with a whitespace, false otherwise.
	 */
	public startsWithSpace(): boolean {
		return !this.atEnd() && isXmlSpaceByte(this.currByteUnchecked());
	}

	/**
	 * Consumes whitespace characters in the stream.
	 * Like `skipSpaces()`, but checks that first char is actually a space.
	 * @throws Error if the stream doesn't start with a whitespace or is at the end.
	 */
	public consumeSpaces(): void {
		if (this.atEnd()) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' }, this.genTextPos());
		}

		if (!this.startsWithSpace()) {
			throw new XmlError(
				{ type: 'InvalidChar', expected: 'a whitespace', actual: this.currByteUnchecked() },
				this.genTextPos()
			);
		}

		this.skipSpaces();
	}

	/**
	 * Tries to consume a reference (entity or character reference).
	 * Consumes according to: https://www.w3.org/TR/xml/#NT-Reference
	 * @returns The consumed reference or null if not a reference.
	 */
	public tryConsumeReference(): TReference | null {
		const start = this.getPos();

		// Consume reference on a substream
		const subStream = this.clone();
		const result = subStream.consumeReference();

		// If the current data is a reference than advance the current stream
		// by number of bytes read by substream
		if (result != null) {
			this.advance(subStream.getPos() - start);
			return result;
		}

		return null;
	}

	/**
	 * Consumes a reference (entity or character reference).
	 * @returns The consumed reference or null if not a reference.
	 */
	public consumeReference(): TReference | null {
		if (!this.tryConsumeByte(38 /* & */)) {
			return null;
		}

		const getReference = (): TReference | null => {
			if (this.tryConsumeByte(35 /* # */)) {
				let value: string;
				let radix: number;

				if (this.tryConsumeByte(120 /* x */)) {
					value = this.consumeBytes(
						(byte) =>
							(byte >= 48 /* 0 */ && byte <= 57) /* 9 */ ||
							(byte >= 65 /* A */ && byte <= 70) /* F */ ||
							(byte >= 97 /* a */ && byte <= 102) /* f */
					);
					radix = 16;
				} else {
					value = this.consumeBytes((byte) => isAsciiDigit(byte));
					radix = 10;
				}

				const n = parseInt(value, radix);
				if (isNaN(n)) {
					return null;
				}

				const c = String.fromCodePoint(n);
				if (!isXmlChar(c)) {
					return null;
				}

				return { type: 'Char', value: c };
			}

			const name = this.consumeName();

			switch (name) {
				case 'quot':
					return { type: 'Char', value: '"' };
				case 'amp':
					return { type: 'Char', value: '&' };
				case 'apos':
					return { type: 'Char', value: "'" };
				case 'lt':
					return { type: 'Char', value: '<' };
				case 'gt':
					return { type: 'Char', value: '>' };
				default:
					return { type: 'Entity', value: name };
			}
		};

		const reference = getReference();
		this.consumeByte(59 /* ; */);

		return reference;
	}

	/**
	 * Consumes an XML name.
	 * Consumes according to: https://www.w3.org/TR/xml/#NT-Name
	 * @returns The consumed name.
	 * @throws Error if an invalid name.
	 */
	public consumeName(): string {
		const start = this._pos;
		this.skipName();

		const name = this.sliceBack(start);
		if (name.length === 0) {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		return name;
	}

	/**
	 * Skips an XML name.
	 * The same as `consumeName()`, but does not return a consumed name.
	 * @throws Error if an invalid name.
	 */
	public skipName(): void {
		const start = this._pos;

		for (const charByte of this.charBytes()) {
			const char = String.fromCharCode(charByte);
			if (this._pos === start) {
				if (!isXmlNameStart(char)) {
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (!isXmlName(char)) {
				break;
			}
			this.advance(char.length);
		}
	}

	/**
	 * Consumes a qualified XML name and returns it.
	 * Consumes according to: https://www.w3.org/TR/xml-names/#ns-qualnames
	 * @throws Error if an invalid qualified XML name.
	 */
	public consumeQName(): [string, string] {
		const start = this._pos;
		let splitter: number | null = null;

		while (!this.atEnd()) {
			// Check for ASCII first for performance reasons
			const currByte = this.currByteUnchecked();
			if (currByte < 128) {
				if (currByte === 58 /* : */) {
					if (splitter == null) {
						splitter = this._pos;
						this.advance(1);
					} else {
						// Multiple `:` is an error
						throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
					}
				} else if (isXmlName(String.fromCharCode(currByte))) {
					this.advance(1);
				} else {
					break;
				}
			} else {
				const char = String.fromCodePoint(currByte);
				if (isXmlName(char)) {
					this.advance(char.length);
				} else {
					break;
				}
			}
		}

		const prefix =
			splitter != null
				? this._span.sliceRegion(start, splitter)
				: this._span.sliceRegion(start, start);
		const local = splitter != null ? this.sliceBack(splitter + 1) : this.sliceBack(start);

		// Prefix must start with a `NameStartChar`
		if (prefix.length > 0 && !isXmlNameStart(prefix[0] as unknown as string)) {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		// Local name must start with a `NameStartChar`
		if (local.length > 0) {
			if (!isXmlNameStart(local[0] as unknown as string)) {
				throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
			}
		} else {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		return [prefix, local];
	}

	/**
	 * Consumes an equal sign, surrounded by optional whitespace.
	 */
	public consumeEq(): void {
		this.skipSpaces();
		this.consumeByte(61 /* = */);
		this.skipSpaces();
	}

	/**
	 * Consumes a quote character.
	 * @throws Error if an invalid quote.
	 */
	public consumeQuote(): number {
		const c = this.currByte();
		if (c === 39 /* ' */ || c === 34 /* " */) {
			this.advance(1);
			return c;
		}
		throw new XmlError({ type: 'InvalidChar', expected: 'a quote', actual: c }, this.genTextPos());
	}

	/**
	 * Calculates a current absolute position.
	 *
	 * This operation is very expensive. Use only for errors.
	 * @returns Text position.
	 */
	public genTextPos(): TTextPos {
		const row = XmlStream.calcCurrRow(this._span.bytes, this._pos);
		const col = XmlStream.calcCurrCol(this._span.bytes, this._pos);

		return { row, col };
	}

	/**
	 * Calculates an absolute position at `pos`.
	 *
	 * This operation is very expensive. Use only for errors.
	 * @param pos - Position
	 * @returns Text position.
	 */
	public genTextPosFrom(pos: number): TTextPos {
		const clampedPos = Math.min(pos, this._span.length);
		const bytes = this._span.bytes.subarray(0, clampedPos);
		const row = XmlStream.calcCurrRow(bytes, clampedPos);
		const col = XmlStream.calcCurrCol(bytes, clampedPos);
		return { row, col };
	}

	// Calculates the current row in the text.
	private static calcCurrRow(bytes: Uint8Array, end: number): number {
		let row = 1;
		for (let i = 0; i < Math.min(end, bytes.length); i++) {
			if (bytes[i] === 10 /* \n */) {
				row++;
			}
		}
		return row;
	}

	// Calculates the current column in the text.
	private static calcCurrCol(bytes: Uint8Array, end: number): number {
		let col = 1;
		for (let i = end - 1; i >= 0; i--) {
			if (bytes[i] === 10 /* \n */) {
				break;
			} else {
				col++;
			}
		}
		return col;
	}
}
