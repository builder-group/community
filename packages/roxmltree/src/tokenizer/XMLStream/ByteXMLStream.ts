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

// TODO:
// Byte based implementation is around 5 times slower than string based
// [roxmltree:byte]     12.4869  78.6583  83.2979  80.0840  80.4702  83.2979  83.2979  83.2979  ±1.27%       10
// [roxmltree:text]     58.8184  15.6937  19.1283  17.0015  17.0783  19.1283  19.1283  19.1283  ±1.51%       30
export class ByteXmlStream implements TXmlStream {
	private _buffer: Uint8Array;
	private _pos: number;
	private _end: number;
	private _textDecoder = new TextDecoder();

	public constructor(buffer: Uint8Array, pos = 0) {
		this._buffer = buffer;
		this._pos = pos;
		this._end = this._buffer.length;
	}

	public clone(): ByteXmlStream {
		return new ByteXmlStream(this._buffer);
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
		return this._buffer[this._pos] as unknown as number;
	}

	public currByteUnchecked(): number {
		return this._buffer[this._pos] as unknown as number;
	}

	public nextByte(): number {
		if (this._pos + 1 >= this._end) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return this._buffer[this._pos + 1] as unknown as number;
	}

	public advance(n: number): void {
		this._pos = Math.min(this._pos + n, this._end);
	}

	public startsWith(text: string): boolean {
		const bytes = new TextEncoder().encode(text);
		if (this._end - this._pos < bytes.length) return false;
		for (let i = 0; i < bytes.length; i++) {
			if (this._buffer[this._pos + i] !== bytes[i]) return false;
		}
		return true;
	}

	public consumeByte(c: number): void {
		const curr = this.currByte();
		if (curr !== c) {
			throw new XmlError({ type: 'InvalidChar', expected: c, actual: curr }, this.genTextPos());
		}
		this._pos++;
	}

	public tryConsumeByte(c: number): boolean {
		if (this._pos < this._end && this._buffer[this._pos] === c) {
			this._pos++;
			return true;
		}
		return false;
	}

	public skipString(text: string): void {
		const bytes = new TextEncoder().encode(text);
		if (this._end - this._pos < bytes.length || !this.startsWith(text)) {
			throw new XmlError({ type: 'InvalidString', expected: text }, this.genTextPos());
		}
		this._pos += bytes.length;
	}

	public consumeBytes(predicate: (byte: number) => boolean): string {
		const start = this._pos;
		while (this._pos < this._end && predicate(this._buffer[this._pos] as unknown as number)) {
			this._pos++;
		}
		return this.decodeSlice(start, this._pos);
	}

	public skipBytes(predicate: (byte: number) => boolean): void {
		while (this._pos < this._end && predicate(this._buffer[this._pos] as unknown as number)) {
			this._pos++;
		}
	}

	public consumeChars(predicate: (stream: ByteXmlStream, char: string) => boolean): string {
		const start = this._pos;
		this.skipChars(predicate);
		return this.decodeSlice(start, this._pos);
	}

	public skipChars(predicate: (stream: ByteXmlStream, char: string) => boolean): void {
		while (this._pos < this._end) {
			const charLength = this.getCharLength(this._buffer[this._pos] as unknown as number);
			if (this._pos + charLength > this._end) break;

			const char = this.decodeSlice(this._pos, this._pos + charLength);
			if (!isXmlChar(char)) {
				throw new XmlError({ type: 'NonXmlChar', char }, this.genTextPos());
			} else if (predicate(this, char)) {
				this._pos += charLength;
			} else {
				break;
			}
		}
	}

	public sliceBack(pos: number): string {
		return this.decodeSlice(pos, this._pos);
	}

	public sliceBackSpan(pos: number): string {
		return this.decodeSlice(pos, this._pos);
	}

	public rangeFrom(start: number): TRange {
		return { start, end: this._pos };
	}

	public skipSpaces(): void {
		while (this._pos < this._end && isXmlSpaceByte(this._buffer[this._pos] as unknown as number)) {
			this._pos++;
		}
	}

	public startsWithSpace(): boolean {
		return this._pos < this._end && isXmlSpaceByte(this._buffer[this._pos] as unknown as number);
	}

	public consumeSpaces(): void {
		if (this.atEnd()) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' }, this.genTextPos());
		}

		if (!this.startsWithSpace()) {
			throw new XmlError(
				{
					type: 'InvalidChar',
					expected: 'a whitespace',
					actual: this._buffer[this._pos] as unknown as number
				},
				this.genTextPos()
			);
		}

		this.skipSpaces();
	}

	public tryConsumeReference(): TReference | null {
		const start = this._pos;
		const subStream = this.clone();
		const result = subStream.consumeReference();
		if (result != null) {
			this._pos += subStream._pos - start;
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

		const name = this.decodeSlice(start, this._pos);
		if (name.length === 0) {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		return name;
	}

	public skipName(): void {
		const start = this._pos;

		while (this._pos < this._end) {
			const charLength = this.getCharLength(this._buffer[this._pos] as unknown as number);
			if (this._pos + charLength > this._end) break;

			const char = this.decodeSlice(this._pos, this._pos + charLength);
			if (this._pos === start) {
				if (!isXmlNameStart(char)) {
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (!isXmlName(char)) {
				break;
			}
			this._pos += charLength;
		}
	}

	public consumeQName(): [string, string] {
		const start = this._pos;
		let splitter: number | null = null;

		while (this._pos < this._end) {
			const currByte = this._buffer[this._pos] as unknown as number;
			if (currByte < 128) {
				if (currByte === COLON) {
					if (splitter == null) {
						splitter = this._pos;
						this._pos++;
					} else {
						throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
					}
				} else if (isXmlName(currByte)) {
					this._pos++;
				} else {
					break;
				}
			} else {
				const charLength = this.getCharLength(currByte);
				if (this._pos + charLength > this._end) break;
				const char = this.decodeSlice(this._pos, this._pos + charLength);
				if (isXmlName(char)) {
					this._pos += charLength;
				} else {
					break;
				}
			}
		}

		const prefix = splitter != null ? this.decodeSlice(start, splitter) : '';
		const local =
			splitter != null
				? this.decodeSlice(splitter + 1, this._pos)
				: this.decodeSlice(start, this._pos);

		if (prefix.length > 0 && !isXmlNameStart(prefix[0] as unknown as string)) {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

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
		const c = this.currByte();
		if (c === SINGLE_QUOTE || c === DOUBLE_QUOTE) {
			this._pos++;
			return c;
		}
		throw new XmlError({ type: 'InvalidChar', expected: 'a quote', actual: c }, this.genTextPos());
	}

	public genTextPos(): TTextPos {
		return this.genTextPosFrom(this._pos);
	}

	public genTextPosFrom(pos: number): TTextPos {
		const clampedPos = Math.min(pos, this._end);
		let row = 1;
		let col = 1;
		for (let i = 0; i < clampedPos; i++) {
			if (this._buffer[i] === NEW_LINE) {
				row++;
				col = 1;
			} else {
				col++;
			}
		}
		return { row, col };
	}

	private getCharLength(byte: number): number {
		if (byte < 128) return 1;
		if (byte >= 240) return 4;
		if (byte >= 224) return 3;
		if (byte >= 192) return 2;
		return 1; // Invalid UTF-8 byte, treat as 1-byte char
	}

	private decodeSlice(start: number, end: number): string {
		return this._textDecoder.decode(this._buffer.subarray(start, end));
	}
}
