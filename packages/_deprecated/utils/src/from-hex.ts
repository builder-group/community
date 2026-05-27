/**
 * Decodes a hex string into a Uint8Array.
 *
 * @param hexString - A string containing hexadecimal characters (0-9, A-F).
 * @returns A Uint8Array representing the decoded byte values.
 */
export function fromHex(hexString: string): Uint8Array | null {
	if (hexString.length % 2 !== 0) {
		return null;
	}

	const byteLength = hexString.length / 2;
	const byteArray = new Uint8Array(byteLength);

	for (let i = 0; i < byteLength; i++) {
		// Extract each 2-character chunk and convert it into a byte
		byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
	}

	return byteArray;
}
