import { type TRange, type TReference, type TTextPos } from '../types';
import {
	AMPERSAND,
	COLON,
	DOUBLE_QUOTE,
	EQUALS,
	HASH,
	isAsciiDigit,
	isXmlChar,
	isXmlNameByte,
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

// TODO:
// Byte based implementation is around 5 times slower than string based
// [roxmltree:byte]     12.4869  78.6583  83.2979  80.0840  80.4702  83.2979  83.2979  83.2979  ±1.27%       10
// [roxmltree:text]     58.8184  15.6937  19.1283  17.0015  17.0783  19.1283  19.1283  19.1283  ±1.51%       30
export class ByteXmlStream implements TXmlStream {
	private _buffer: Uint8Array;
	private _pos: number;
	private _end: number;

	public constructor(buffer: Uint8Array, pos = 0) {
		this._buffer = buffer;
		this._pos = pos;
		this._end = this._buffer.length;
	}

	public clone(): ByteXmlStream {
		return new ByteXmlStream(this._buffer, this._pos);
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

	public startsWith(bytes: Uint8Array): boolean {
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

	public skipBytes(bytes: Uint8Array): void {
		if (this._end - this._pos < bytes.length || !this.startsWith(bytes)) {
			throw new XmlError(
				{ type: 'InvalidString', expected: String.fromCharCode(...bytes) },
				this.genTextPos()
			);
		}
		this._pos += bytes.length;
	}

	public consumeBytesWhile(
		predicate: (stream: ByteXmlStream, byte: number) => boolean
	): Uint8Array {
		const start = this._pos;
		while (this._pos < this._end && predicate(this, this._buffer[this._pos] as unknown as number)) {
			this._pos++;
		}
		return this._buffer.subarray(start, this._pos);
	}

	public skipBytesWhile(predicate: (stream: ByteXmlStream, byte: number) => boolean): void {
		while (this._pos < this._end && predicate(this, this._buffer[this._pos] as unknown as number)) {
			this._pos++;
		}
	}

	public sliceBack(pos: number): Uint8Array {
		return this._buffer.subarray(pos, this._pos);
	}

	public rangeFrom(start: number): TRange {
		return { start, end: this._pos };
	}

	public skipSpaces(): void {
		this.skipBytesWhile((_, b) => isXmlSpaceByte(b));
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
			if (this.tryConsumeByte(HASH)) {
				let value: number;
				let radix: number;

				if (this.tryConsumeByte(LOWERCASE_X)) {
					const hexBytes = this.consumeBytesWhile(
						(_, byte) =>
							(byte >= ZERO && byte <= NINE) ||
							(byte >= UPPERCASE_A && byte <= UPPERCASE_F) ||
							(byte >= LOWERCASE_A && byte <= LOWERCASE_F)
					);
					value = parseInt(String.fromCharCode(...hexBytes), 16);
					radix = 16;
				} else {
					const digitBytes = this.consumeBytesWhile((_, byte) => isAsciiDigit(byte));
					value = parseInt(String.fromCharCode(...digitBytes), 10);
					radix = 10;
				}

				if (isNaN(value)) {
					return null;
				}

				const c = String.fromCodePoint(value);
				if (!isXmlChar(c)) {
					return null;
				}

				return { type: 'Char', value: c };
			}

			const name = this.consumeName();
			const nameStr = String.fromCharCode(...name);

			switch (nameStr) {
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
					return { type: 'Entity', value: nameStr };
			}
		};

		const reference = getReference();
		this.consumeByte(SEMICOLON);

		return reference;
	}

	public consumeName(): Uint8Array {
		const start = this._pos;
		this.skipName();

		const name = this._buffer.subarray(start, this._pos);
		if (name.length === 0) {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		return name;
	}

	public skipName(): void {
		const start = this._pos;

		while (this._pos < this._end) {
			const currByte = this._buffer[this._pos] as unknown as number;
			if (this._pos === start) {
				if (!isXmlNameByte(currByte)) {
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (!isXmlNameByte(currByte)) {
				break;
			}
			this._pos++;
		}
	}

	public consumeQName(): [Uint8Array, Uint8Array] {
		const start = this._pos;
		let splitter: number | null = null;

		while (this._pos < this._end) {
			const currByte = this._buffer[this._pos] as unknown as number;
			if (currByte === COLON) {
				if (splitter == null) {
					splitter = this._pos;
					this._pos++;
				} else {
					throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
				}
			} else if (isXmlNameByte(currByte)) {
				this._pos++;
			} else {
				break;
			}
		}

		const prefix = splitter != null ? this._buffer.subarray(start, splitter) : new Uint8Array(0);
		const local =
			splitter != null
				? this._buffer.subarray(splitter + 1, this._pos)
				: this._buffer.subarray(start, this._pos);

		if (prefix.length > 0 && !isXmlNameStart(prefix[0] as unknown as number)) {
			throw new XmlError({ type: 'InvalidName' }, this.genTextPosFrom(start));
		}

		if (local.length > 0) {
			if (!isXmlNameStart(local[0] as unknown as number)) {
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
			if (this._buffer[i] === LINE_FEED) {
				row++;
				col = 1;
			} else {
				col++;
			}
		}
		return { row, col };
	}
}
