// Pre-Init (constants are precomputed for performance reasons)
const LUT_HEX_4b = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
const LUT_HEX_8b = new Array(0x100).fill('');

// Populate the lookup table for hex values
for (let n = 0; n < 0x100; n++) {
	LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xf]}${LUT_HEX_4b[n & 0xf]}`;
}

/**
 * Converts a Uint8Array (or any typed array with bytes) to a hex string
 *
 * https://www.xaymar.com/articles/2020/12/08/fastest-uint8array-to-hex-string-conversion-in-javascript/
 *
 * @param buffer - A buffer of byte values, typically a Uint8Array or Buffer
 * @returns The hexadecimal string representation of the buffer
 */
export function toHex(buffer: Uint8Array | Buffer): string {
	if (buffer.length === 0) {
		return '';
	}

	let out = '';
	for (let idx = 0, len = buffer.length; idx < len; idx++) {
		// @ts-expect-error - buffer can't be undefined because we check length in for loop

		out += LUT_HEX_8b[buffer[idx]];
	}

	return out;
}
