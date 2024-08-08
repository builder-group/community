import { type TRange, type TReference, type TTextPos } from '../types';
import {
	AMPERSAND,
	COLON,
	DOUBLE_QUOTE,
	EQUALS,
	HASH,
	isAsciiDigit,
	isXmlChar,
	isXmlName,
	isXmlNameStart,
	isXmlSpaceByte,
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
} from '../utils';
import { XmlError } from '../XmlError';
import { type TXmlStream } from './types';

export class TextXmlStream implements TXmlStream {
	private _text: string;
	private _pos: number;
	private _end: number;

	public constructor(text: string, pos = 0) {
		this._text = text;
		this._pos = pos;
		this._end = this._text.length;
	}

	public clone(): TextXmlStream {
		return new TextXmlStream(this._text, this._pos);
	}

	public getPos(): number {
		return this._pos;
	}

	public atEnd(): boolean {
		return this._pos >= this._end;
	}

	public currByte(): number {
		if (this._pos >= this._end) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return this._text.charCodeAt(this._pos);
	}

	public currByteUnchecked(): number {
		return this._text.charCodeAt(this._pos);
	}

	public nextByte(): number {
		if (this._pos + 1 >= this._end) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return this._text.charCodeAt(this._pos + 1);
	}

	public advance(n: number): void {
		this._pos += n;
	}

	public startsWith(text: string): boolean {
		return this._text.startsWith(text, this._pos);
	}

	public consumeByte(byte: number): void {
		const currByte = this.currByte();
		if (currByte !== byte) {
			throw new XmlError(
				{ type: 'InvalidChar', expected: byte, actual: currByte },
				this.genTextPos()
			);
		}
		this._pos += 1;
	}

	public tryConsumeByte(byte: number): boolean {
		if (this.currByte() === byte) {
			this._pos += 1;
			return true;
		}
		return false;
	}

	public skipString(text: string): void {
		if (!this.startsWith(text)) {
			throw new XmlError({ type: 'InvalidString', expected: text }, this.genTextPos());
		}
		this._pos += text.length;
	}

	public consumeBytesWhile(predicate: (byte: number) => boolean): string {
		const start = this._pos;
		this.skipBytesWhile(predicate);
		return this.sliceBack(start);
	}

	public skipBytesWhile(predicate: (byte: number) => boolean): void {
		while (this._pos < this._end && predicate(this.currByteUnchecked())) {
			this._pos += 1;
		}
	}

	public consumeCharsWhile(predicate: (stream: TextXmlStream, char: string) => boolean): string {
		const start = this._pos;
		this.skipCharsWhile(predicate);
		return this.sliceBack(start);
	}

	public skipCharsWhile(predicate: (stream: TextXmlStream, char: string) => boolean): void {
		while (this._pos < this._end) {
			const char = this._text[this._pos] as unknown as string;
			if (!isXmlChar(char)) {
				throw new XmlError({ type: 'NonXmlChar', char }, this.genTextPos());
			} else if (predicate(this, char)) {
				this._pos += char.length;
			} else {
				break;
			}
		}
	}

	public sliceBack(pos: number): string {
		return this._text.slice(pos, this._pos);
	}

	public rangeFrom(start: number): TRange {
		return { start, end: this._pos };
	}

	public skipSpaces(): void {
		while (this.startsWithSpace()) {
			this._pos += 1;
		}
	}

	public startsWithSpace(): boolean {
		return this._pos < this._end && isXmlSpaceByte(this.currByteUnchecked());
	}

	public consumeSpaces(): void {
		if (this._pos >= this._end) {
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

	public tryConsumeReference(): TReference | null {
		const start = this._pos;

		// Consume reference on a substream
		const subStream = this.clone();
		const result = subStream.consumeReference();

		// If the current data is a reference than advance the current stream
		// by number of bytes read by substream
		if (result != null) {
			this._pos += subStream.getPos() - start;
			return result;
		}

		return null;
	}

	public consumeReference(): TReference | null {
		if (!this.tryConsumeByte(AMPERSAND)) {
			return null;
		}

		let reference: TReference | null;

		if (this.tryConsumeByte(HASH)) {
			let value: string;
			let radix: number;

			if (this.tryConsumeByte(LOWERCASE_X)) {
				value = this.consumeBytesWhile(
					(byte) =>
						(byte >= ZERO && byte <= NINE) ||
						(byte >= UPPERCASE_A && byte <= UPPERCASE_F) ||
						(byte >= LOWERCASE_A && byte <= LOWERCASE_F)
				);
				radix = 16;
			} else {
				value = this.consumeBytesWhile((byte) => isAsciiDigit(byte));
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

		if (!this.tryConsumeByte(SEMICOLON)) {
			return null;
		}

		return reference;
	}

	public consumeName(): string {
		const start = this._pos;
		this.skipName();

		const name = this.sliceBack(start);
		if (name.length === 0) {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		return name;
	}

	public skipName(): void {
		const start = this._pos;

		while (this._pos < this._end) {
			const currByte = this.currByteUnchecked();
			if (this._pos === start) {
				if (!isXmlNameStart(currByte)) {
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (!isXmlName(currByte)) {
				break;
			}
			this._pos += 1;
		}
	}

	public consumeQName(): [string, string] {
		const start = this._pos;
		let splitter: number | null = null;

		while (this._pos < this._end) {
			const currByte = this.currByteUnchecked();
			if (currByte === COLON) {
				if (splitter == null) {
					splitter = this._pos;
					this._pos += 1;
				} else {
					// Multiple `:` is an error
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (isXmlName(currByte)) {
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

	public consumeEq(): void {
		this.skipSpaces();
		this.consumeByte(EQUALS);
		this.skipSpaces();
	}

	public consumeQuote(): number {
		const currByte = this.currByte();
		if (currByte === SINGLE_QUOTE || currByte === DOUBLE_QUOTE) {
			this._pos += 1;
			return currByte;
		}
		throw new XmlError(
			{ type: 'InvalidChar', expected: 'a quote', actual: currByte },
			this.genTextPos()
		);
	}

	public genTextPos(): TTextPos {
		return this.genTextPosFrom(this._pos);
	}

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
