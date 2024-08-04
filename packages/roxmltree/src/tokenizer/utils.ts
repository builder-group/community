// ASCII byte literal
export function b(c: string): number {
	if (c.length !== 1) {
		throw new Error('Input must be a single character');
	}
	return c.charCodeAt(0);
}

export function isAsciiDigit(c: string | number): boolean {
	const code = typeof c === 'string' ? b(c) : c;
	return code >= 48 && code <= 57; // '0' (48) to '9' (57)
}

/**
 * Checks if the character is within the NameStartChar range.
 * @param c - The character to check.
 * @returns True if the character is a valid XML name start character, false otherwise.
 */
export function isXmlNameStart(c: string): boolean {
	const code = c.codePointAt(0);
	if (code == null) {
		return false;
	}

	// Check for ASCII first
	if (code <= 128) {
		return (
			(code >= b('A') && code <= b('Z')) ||
			(code >= b('a') && code <= b('z')) ||
			code === b(':') ||
			code === b('_')
		);
	}

	return (
		(code >= 0xc0 && code <= 0xd6) ||
		(code >= 0xd8 && code <= 0xf6) ||
		(code >= 0xf8 && code <= 0x2ff) ||
		(code >= 0x370 && code <= 0x37d) ||
		(code >= 0x37f && code <= 0x1fff) ||
		(code >= 0x200c && code <= 0x200d) ||
		(code >= 0x2070 && code <= 0x218f) ||
		(code >= 0x2c00 && code <= 0x2fef) ||
		(code >= 0x3001 && code <= 0xd7ff) ||
		(code >= 0xf900 && code <= 0xfdcf) ||
		(code >= 0xfdf0 && code <= 0xfffd) ||
		(code >= 0x10000 && code <= 0xeffff)
	);
}

/**
 * Checks if the character is within the NameChar range.
 * @param c - The character to check.
 * @returns True if the character is a valid XML name character, false otherwise.
 */
export function isXmlName(c: string): boolean {
	const code = c.codePointAt(0);
	if (code == null) {
		return false;
	}

	// Check for ASCII first
	if (code <= 128) {
		return isXmlNameByte(code);
	}

	return (
		code === 0xb7 ||
		(code >= 0xc0 && code <= 0xd6) ||
		(code >= 0xd8 && code <= 0xf6) ||
		(code >= 0xf8 && code <= 0x2ff) ||
		(code >= 0x300 && code <= 0x36f) ||
		(code >= 0x370 && code <= 0x37d) ||
		(code >= 0x37f && code <= 0x1fff) ||
		(code >= 0x200c && code <= 0x200d) ||
		(code >= 0x203f && code <= 0x2040) ||
		(code >= 0x2070 && code <= 0x218f) ||
		(code >= 0x2c00 && code <= 0x2fef) ||
		(code >= 0x3001 && code <= 0xd7ff) ||
		(code >= 0xf900 && code <= 0xfdcf) ||
		(code >= 0xfdf0 && code <= 0xfffd) ||
		(code >= 0x10000 && code <= 0xeffff)
	);
}

/**
 * Checks if the character is within the Char range.
 * @param c - The character to check.
 * @returns True if the character is a valid XML character, false otherwise.
 */
export function isXmlChar(c: string): boolean {
	const code = c.codePointAt(0);
	if (code == null) {
		return false;
	}

	if (code < 0x20) {
		return isXmlSpaceByte(code);
	}

	return code !== 0xffff && code !== 0xfffe;
}

/**
 * Checks if the character is an XML space.
 * @param byte - The byte to check.
 * @returns True if the byte is a valid XML space, false otherwise.
 */
export function isXmlSpaceByte(byte: number): boolean {
	return byte === b(' ') || byte === b('\t') || byte === b('\n') || byte === b('\r');
}

/**
 * Checks if the byte is within the ASCII Char range.
 * @param byte - The byte to check.
 * @returns True if the byte is a valid ASCII XML name character, false otherwise.
 */
export function isXmlNameByte(byte: number): boolean {
	return (
		(byte >= b('0') && byte <= b('9')) ||
		(byte >= b('A') && byte <= b('Z')) ||
		(byte >= b('a') && byte <= b('z')) ||
		byte === b(':') ||
		byte === b('_') ||
		byte === b('-') ||
		byte === b('.')
	);
}
