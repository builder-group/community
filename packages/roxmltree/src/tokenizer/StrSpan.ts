import { XmlError } from './XMLError';

/**
 * A string slice that also contains the position in the input XML
 * from which it was parsed.
 */
export class StrSpan {
	private static encoder = new TextEncoder();
	private static decoder = new TextDecoder();

	private readonly _bytes: Uint8Array;
	private readonly _start: number;

	public constructor(bytes: Uint8Array, start = 0) {
		this._bytes = bytes;
		this._start = start;
	}

	public static fromString(text: string, start = 0): StrSpan {
		return new StrSpan(StrSpan.encoder.encode(text), start);
	}

	public static fromSubBytes(bytes: Uint8Array, start: number, end: number): StrSpan {
		return new StrSpan(bytes.subarray(start, end), start);
	}

	public get length(): number {
		return this._bytes.length;
	}

	public get bytes(): Uint8Array {
		return this._bytes;
	}

	public getByte(index: number): number {
		const byte = this._bytes[index];
		if (byte == null) {
			throw new XmlError({ type: 'UnexpectedEndOfStream' });
		}
		return byte;
	}

	public getRange(): [number, number] {
		return [this._start, this._start + this._bytes.length];
	}

	public sliceRegion(start: number, end: number): string {
		return StrSpan.decoder.decode(this._bytes.subarray(start, end));
	}

	public startsWith(text: string, pos = 0): boolean {
		if (pos < 0 || pos > this._bytes.length) {
			return false;
		}

		const textBytes = StrSpan.encoder.encode(text);
		if (this._bytes.length - pos < textBytes.length) {
			return false;
		}

		for (let i = 0; i < textBytes.length; i++) {
			if (this.getByte(pos + i) !== textBytes[i]) {
				return false;
			}
		}

		return true;
	}

	public clone(): StrSpan {
		return new StrSpan(new Uint8Array(this._bytes), this._start);
	}

	public toString(): string {
		return StrSpan.decoder.decode(this._bytes);
	}
}
