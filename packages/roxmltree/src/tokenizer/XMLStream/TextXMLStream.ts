import { type TRange, type TReference, type TTextPos } from '../types';
import {
	A_LOWER,
	A_UPPER,
	AMPERSAND,
	COLON,
	DOUBLE_QUOTE,
	EQUALS,
	F_LOWER,
	F_UPPER,
	HASHTAG,
	isAsciiDigit,
	isXmlChar,
	isXmlName,
	isXmlNameStart,
	isXmlSpaceByte,
	NEW_LINE,
	NINE,
	SEMICOLON,
	SINGLE_QUOTE,
	X_LOWER,
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
		if (this.atEnd()) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return this.currByteUnchecked();
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
		this._pos = Math.min(this._pos + n, this._end);
	}

	public startsWith(text: string): boolean {
		return this._text.startsWith(text, this._pos);
	}

	public consumeByte(c: number): void {
		const curr = this.currByte();
		if (curr !== c) {
			throw new XmlError({ type: 'InvalidChar', expected: c, actual: curr }, this.genTextPos());
		}
		this._pos += 1;
	}

	public tryConsumeByte(c: number): boolean {
		if (this.currByte() === c) {
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

	public consumeBytes(predicate: (byte: number) => boolean): string {
		const start = this._pos;
		this.skipBytes(predicate);
		return this.sliceBack(start);
	}

	public skipBytes(predicate: (byte: number) => boolean): void {
		while (!this.atEnd() && predicate(this.currByteUnchecked())) {
			this._pos += 1;
		}
	}

	public consumeChars(predicate: (stream: TextXmlStream, char: string) => boolean): string {
		const start = this._pos;
		this.skipChars(predicate);
		return this.sliceBack(start);
	}

	public skipChars(predicate: (stream: TextXmlStream, char: string) => boolean): void {
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

	public sliceBackSpan(pos: number): string {
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
		return !this.atEnd() && isXmlSpaceByte(this.currByteUnchecked());
	}

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

		const getReference = (): TReference | null => {
			if (this.tryConsumeByte(HASHTAG)) {
				let value: string;
				let radix: number;

				if (this.tryConsumeByte(X_LOWER)) {
					value = this.consumeBytes(
						(byte) =>
							(byte >= ZERO && byte <= NINE) ||
							(byte >= A_UPPER && byte <= F_UPPER) ||
							(byte >= A_LOWER && byte <= F_LOWER)
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
		this.consumeByte(SEMICOLON);

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
			const char = this._text[this._pos] as unknown as string;
			if (this._pos === start) {
				if (!isXmlNameStart(char)) {
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (!isXmlName(char)) {
				break;
			}
			this._pos += char.length;
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

		const prefix = splitter != null ? this._text.slice(start, splitter) : '';
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

	public consumeEq(): void {
		this.skipSpaces();
		this.consumeByte(EQUALS);
		this.skipSpaces();
	}

	public consumeQuote(): number {
		const byte = this.currByte();
		if (byte === SINGLE_QUOTE || byte === DOUBLE_QUOTE) {
			this._pos += 1;
			return byte;
		}
		throw new XmlError(
			{ type: 'InvalidChar', expected: 'a quote', actual: byte },
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
			if (this._text.charCodeAt(i) === NEW_LINE) {
				row++;
				col = 1;
			} else {
				col++;
			}
		}
		return { row, col };
	}
}
