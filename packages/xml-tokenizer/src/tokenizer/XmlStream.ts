import {
	AMPERSAND,
	COLON,
	DOUBLE_QUOTE,
	HASH,
	LINE_FEED,
	LOWERCASE_A,
	LOWERCASE_F,
	LOWERCASE_X,
	NINE,
	SEMICOLON,
	SINGLE_QUOTE,
	UPPERCASE_A,
	UPPERCASE_F,
	ZERO
} from './ascii-constants';
import { type TRange, type TReference, type TTextPos } from './types';
import { isAsciiDigit, isXmlChar, isXmlName, isXmlNameStart, isXmlSpaceByte } from './utils';
import { XmlError } from './XmlError';

/**
 * A stream of characters for parsing XML-like content.
 *
 * This implementation uses UTF-16 code units, whereas the Rust implementation is based on bytes (UTF-8).
 * This difference in encoding affects how characters are handled and parsed.
 * For more details, refer to the FAQ.
 */
export class XmlStream {
	private _text: string;
	private _pos: number;
	private _end: number;

	public constructor(text: string, pos = 0) {
		this._text = text;
		this._pos = pos;
		this._end = this._text.length;
	}

	/**
	 * Creates a clone of the current stream.
	 *
	 * @returns A new instance of XmlStream with the same state.
	 */
	public clone(): XmlStream {
		return new XmlStream(this._text, this._pos);
	}

	/**
	 * Gets the current position in the stream.
	 *
	 * @returns The current position.
	 */
	public getPos(): number {
		return this._pos;
	}

	/**
	 * Checks if the stream is at the end.
	 *
	 * @returns True if at the end, false otherwise.
	 */
	public atEnd(): boolean {
		return this._pos >= this._end;
	}

	/**
	 * Gets the current code unit in the stream.
	 *
	 * @returns The current code unit.
	 * @throws XmlError if at the end of the stream.
	 */
	public currCodeUnit(): number {
		if (this._pos >= this._end) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return this._text.charCodeAt(this._pos);
	}

	/**
	 * Gets the current code unit without checking for the end.
	 *
	 * @returns The current code unit.
	 */
	public currCodeUnitUnchecked(): number {
		return this._text.charCodeAt(this._pos);
	}

	/**
	 * Gets the next code unit in the stream.
	 *
	 * @returns The next code unit.
	 * @throws XmlError if at the end of the stream.
	 */
	public nextCodeUnit(): number {
		if (this._pos + 1 >= this._end) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return this._text.charCodeAt(this._pos + 1);
	}

	/**
	 * Advances the stream position by the specified number of characters.
	 *
	 * @param n - The number of characters to advance.
	 */
	public advance(n: number): void {
		this._pos += n;
	}

	/**
	 * Go to a new position in the stream.
	 *
	 *  @param pos - The new position.
	 */
	public goTo(pos: number): void {
		this._pos = pos;
	}

	/**
	 * Checks if the stream starts with the given text.
	 *
	 * @param text - The text to check.
	 * @returns True if the stream starts with the text, false otherwise.
	 */
	public startsWith(text: string): boolean {
		return this._text.startsWith(text, this._pos);
	}

	/**
	 * Consumes a specific code unit (character) from the stream.
	 *
	 * @param codeUnit - The code unit to consume.
	 * @throws XmlError if the current code unit doesn't match or if at the end.
	 */
	public consumeCodeUnit(codeUnit: number): void {
		const currCodeUnit = this.currCodeUnit();
		if (currCodeUnit !== codeUnit) {
			throw new XmlError(
				{ type: 'InvalidChar', expected: codeUnit, actual: currCodeUnit },
				this.genTextPos()
			);
		}
		this._pos += 1;
	}

	/**
	 * Tries to consume a specific code unit (character) from the stream.
	 * Unlike `consumeCodeUnit`, it will not throw any errors.
	 *
	 * @param codeUnit - The code unit to consume.
	 * @returns True if the code unit was consumed, false otherwise.
	 */
	public tryConsumeCodeUnit(codeUnit: number): boolean {
		if (this.currCodeUnit() === codeUnit) {
			this._pos += 1;
			return true;
		}
		return false;
	}

	/**
	 * Skips a specific string in the stream.
	 *
	 * @param text - The string to skip.
	 * @throws XmlError if the stream doesn't start with the given string.
	 */
	public skipString(text: string): void {
		if (!this.startsWith(text)) {
			throw new XmlError({ type: 'InvalidString', expected: text }, this.genTextPos());
		}
		this._pos += text.length;
	}

	/**
	 * Consumes code units that satisfy a predicate function.
	 *
	 * @param predicate - The function to test each code unit.
	 * @returns The consumed string.
	 */
	public consumeCodeUnitsWhile(predicate: (codeUnit: number) => boolean): string {
		const start = this._pos;
		this.skipCodeUnitsWhile(predicate);
		return this.sliceBack(start);
	}

	/**
	 * Skips code units that satisfy a predicate function.
	 *
	 * @param predicate - The function to test each code unit.
	 */
	public skipCodeUnitsWhile(predicate: (codeUnit: number) => boolean): void {
		while (this._pos < this._end && predicate(this.currCodeUnitUnchecked())) {
			this._pos += 1;
		}
	}

	// Doesn't really improve performance compared to 'consumeCharsWhile()'
	// maybe 5% and without validation 25%
	//
	// public consumeCharsUntilIndexOf(text: string): string {
	// 	const start = this._pos;
	// 	const nextPos = this._text.indexOf(text, this._pos);
	//  const endPos = nextPos >= 0 ? nextPos : this._end;

	//   // Iterate over the slice to ensure all characters are valid XML characters
	// 	for (let i = start; i < endPos; i++) {
	// 		const char = this._text[i];
	// 		if (char == null || !isXmlChar(char.codePointAt(0))) {
	// 			throw new XmlError({ type: 'NonXmlChar', char: char ?? '\u{FFFD}' }, this.genTextPos());
	// 		}
	// 	}

	// 	this._pos = endPos;

	// 	return this.sliceBack(start);
	// }

	/**
	 * Consumes characters that satisfy a predicate function.
	 *
	 * @param predicate - The function to test each character.
	 * @returns The consumed string.
	 * @throws XmlError if a non-XML character is encountered.
	 */
	public consumeCharsWhile(predicate: (stream: XmlStream, char: string) => boolean): string {
		const start = this._pos;
		this.skipCharsWhile(predicate);
		return this.sliceBack(start);
	}

	/**
	 * Skips characters that satisfy a predicate function.
	 *
	 * @param predicate - The function to test each character.
	 * @throws XmlError if a non-XML character is encountered.
	 */
	public skipCharsWhile(predicate: (stream: XmlStream, char: string) => boolean): void {
		while (this._pos < this._end) {
			const char = this._text[this._pos];
			if (char == null || !isXmlChar(char.codePointAt(0))) {
				throw new XmlError({ type: 'NonXmlChar', char: char ?? '\u{FFFD}' }, this.genTextPos());
			} else if (predicate(this, char)) {
				this._pos += char.length;
			} else {
				break;
			}
		}
	}

	/**
	 * Slices the text from the given position to the current position.
	 *
	 * @param pos - The start position.
	 * @returns The sliced string.
	 */
	public sliceBack(pos: number): string {
		return this._text.slice(pos, this._pos);
	}

	/**
	 * Creates a range from the given start position to the current position.
	 *
	 * @param start - The start position.
	 * @returns The range object.
	 */
	public rangeFrom(start: number): TRange {
		return { start, end: this._pos };
	}

	/**
	 * Skips whitespace characters in the stream.
	 */
	public skipSpaces(): void {
		while (this.startsWithSpace()) {
			this._pos += 1;
		}
	}

	/**
	 * Checks if the stream starts with a whitespace character.
	 *
	 * @returns True if it starts with a whitespace, false otherwise.
	 */
	public startsWithSpace(): boolean {
		return this._pos < this._end && isXmlSpaceByte(this.currCodeUnitUnchecked());
	}

	/**
	 * Consumes whitespace characters in the stream.
	 * Like `skipSpaces`, but checks that the first char is actually a space.
	 *
	 * @throws XmlError if the stream doesn't start with a whitespace or is at the end.
	 */
	public consumeSpaces(): void {
		if (this._pos >= this._end) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' }, this.genTextPos());
		}

		if (!this.startsWithSpace()) {
			throw new XmlError(
				{ type: 'InvalidChar', expected: 'a whitespace', actual: this.currCodeUnitUnchecked() },
				this.genTextPos()
			);
		}

		this.skipSpaces();
	}

	/**
	 * Tries to consume a reference (entity or character reference).
	 * Consumes according to: https://www.w3.org/TR/xml/#NT-Reference
	 *
	 * @returns The consumed reference or null if not a reference.
	 */
	public tryConsumeReference(): TReference | null {
		const start = this._pos;

		// Consume reference on a substream
		const subStream = this.clone();
		const result = subStream.consumeReference();

		// If the current data is a reference than advance the current stream
		// by number of code units read by substream
		if (result != null) {
			this._pos += subStream.getPos() - start;
			return result;
		}

		return null;
	}

	/**
	 * Consumes a reference (entity or character reference).
	 *
	 * @returns The consumed reference or null if not a reference.
	 */
	public consumeReference(): TReference | null {
		if (!this.tryConsumeCodeUnit(AMPERSAND)) {
			return null;
		}

		let reference: TReference | null;

		if (this.tryConsumeCodeUnit(HASH)) {
			let value: string;
			let radix: number;

			if (this.tryConsumeCodeUnit(LOWERCASE_X)) {
				value = this.consumeCodeUnitsWhile(
					(codeUnit) =>
						(codeUnit >= ZERO && codeUnit <= NINE) ||
						(codeUnit >= UPPERCASE_A && codeUnit <= UPPERCASE_F) ||
						(codeUnit >= LOWERCASE_A && codeUnit <= LOWERCASE_F)
				);
				radix = 16;
			} else {
				value = this.consumeCodeUnitsWhile((codeUnit) => isAsciiDigit(codeUnit));
				radix = 10;
			}

			const codePoint = parseInt(value, radix);
			if (isNaN(codePoint) || !isXmlChar(codePoint)) {
				reference = null;
			} else {
				reference = { type: 'Char', value: String.fromCodePoint(codePoint) };
			}
		} else {
			const name = this.consumeName();
			switch (name) {
				case 'quot':
					reference = { type: 'Char', value: '"' };
					break;
				case 'amp':
					reference = { type: 'Char', value: '&' };
					break;
				case 'apos':
					reference = { type: 'Char', value: "'" };
					break;
				case 'lt':
					reference = { type: 'Char', value: '<' };
					break;
				case 'gt':
					reference = { type: 'Char', value: '>' };
					break;
				default:
					reference = { type: 'Entity', value: name };
			}
		}

		if (!this.tryConsumeCodeUnit(SEMICOLON)) {
			return null;
		}

		return reference;
	}

	/**
	 * Consumes a XML name.
	 * Consumes according to: https://www.w3.org/TR/xml/#NT-Name
	 *
	 * @returns The consumed name.
	 * @throws XmlError if an invalid name is encountered.
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
	 * Skips a XML name.
	 * The same as `consumeName`, but does not return the consumed name.
	 * @throws XmlError if an invalid name is encountered.
	 */
	public skipName(): void {
		const start = this._pos;

		while (this._pos < this._end) {
			const currCodeUnit = this.currCodeUnitUnchecked();
			if (this._pos === start) {
				if (!isXmlNameStart(currCodeUnit)) {
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (!isXmlName(currCodeUnit)) {
				break;
			}
			this._pos += 1;
		}
	}

	/**
	 * Consumes a qualified XML name and returns it.
	 * Consumes according to: https://www.w3.org/TR/xml-names/#ns-qualnames
	 *
	 * @returns The prefix and local name as a tuple.
	 * @throws XmlError if an invalid qualified XML name is encountered.
	 */
	public consumeQName(): [string, string] {
		const start = this._pos;
		let splitter: number | null = null;

		while (this._pos < this._end) {
			const currCodeUnit = this.currCodeUnitUnchecked();
			if (currCodeUnit === COLON) {
				if (splitter == null) {
					splitter = this._pos;
					this._pos += 1;
				} else {
					// Multiple `:` is an error
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (isXmlName(currCodeUnit)) {
				this._pos += 1;
			} else {
				break;
			}
		}

		let prefix;
		let local;
		if (splitter != null) {
			prefix = this._text.slice(start, splitter);
			local = this.sliceBack(splitter + 1);
		} else {
			// Empty prefix. This way we can preserve attribute start position.
			prefix = '';
			local = this.sliceBack(start);
		}

		// Prefix must start with a `NameStartChar`
		if (prefix.length > 0 && !isXmlNameStart(prefix[0]?.codePointAt(0))) {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		// Local name must start with a `NameStartChar`
		if (local.length > 0) {
			if (!isXmlNameStart(local[0]?.codePointAt(0))) {
				throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
			}
		} else {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		return [prefix, local];
	}

	/**
	 * Consumes a quote character.
	 *
	 * @returns The consumed quote character.
	 * @throws XmlError if an invalid quote character is encountered.
	 */
	public consumeQuote(): number {
		const currCodeUnit = this.currCodeUnit();
		if (currCodeUnit === SINGLE_QUOTE || currCodeUnit === DOUBLE_QUOTE) {
			this._pos += 1;
			return currCodeUnit;
		}
		throw new XmlError(
			{ type: 'InvalidChar', expected: 'a quote', actual: currCodeUnit },
			this.genTextPos()
		);
	}

	/**
	 * Calculates the current absolute position.
	 * This operation is very expensive. Use only for errors.
	 *
	 * @returns The current text position.
	 */
	public genTextPos(): TTextPos {
		return this.genTextPosFrom(this._pos);
	}

	/**
	 * Calculates an absolute position at the specified position.
	 * This operation is very expensive. Use only for errors.
	 *
	 * @param pos - The position to calculate from.
	 * @returns The calculated text position.
	 */
	public genTextPosFrom(pos: number): TTextPos {
		const clampedPos = Math.min(pos, this._end);
		let row = 1;
		let col = 1;
		for (let i = 0; i < clampedPos; i++) {
			if (this._text.charCodeAt(i) === LINE_FEED) {
				row++;
				col = 1;
			} else {
				col++;
			}
		}
		return { row, col };
	}
}
