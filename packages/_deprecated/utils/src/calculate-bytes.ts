/**
 * Calculates the byte size of a string,
 * useful in environments lacking `TextEncoder`, `Blob`, or `Buffer` support,
 * such as Figma plugins.
 */
export function calculateBytes(str: string): number {
	let bytes = 0;

	for (let i = 0; i < str.length; i++) {
		const charCode = str.charCodeAt(i);
		if (charCode < 0x80) {
			bytes += 1; // 1 byte for characters in the 0-127 range
		} else if (charCode < 0x800) {
			bytes += 2; // 2 bytes for characters in the 128-2047 range
		} else if (charCode >= 0xd800 && charCode <= 0xdbff) {
			if (
				i + 1 < str.length &&
				str.charCodeAt(i + 1) >= 0xdc00 &&
				str.charCodeAt(i + 1) <= 0xdfff
			) {
				bytes += 4; // 4 bytes for characters beyond the BMP
				i++; // Skip the next char since it's part of the surrogate pair
			}
			// Handling the case where the string ends with the first character of a surrogate pair
			else {
				bytes += 3; // Assuming the orphaned surrogate would be represented similarly to other 3-byte characters
			}
		} else {
			bytes += 3; // 3 bytes for characters in the 2048-65535 range
		}
	}

	return bytes;
}
