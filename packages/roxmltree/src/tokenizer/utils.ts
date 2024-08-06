export function isAsciiDigit(byte: number): boolean {
	return byte >= 48 /* 0 */ && byte <= 57 /* 9 */;
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
			(code >= 65 /* A */ && code <= 90) /* Z */ ||
			(code >= 97 /* a */ && code <= 122) /* z */ ||
			code === 58 /* : */ ||
			code === 95 /* _ */
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
export function isXmlName(c: string | number): boolean {
	const code = typeof c === 'string' ? c.codePointAt(0) : c;
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
	return (
		byte === 32 /* ' ' */ || byte === 9 /* \t */ || byte === 10 /* \n */ || byte === 13 /* \r */
	);
}

/**
 * Checks if the byte is within the ASCII Char range.
 * @param byte - The byte to check.
 * @returns True if the byte is a valid ASCII XML name character, false otherwise.
 */
export function isXmlNameByte(byte: number): boolean {
	return (
		(byte >= 48 /* 0 */ && byte <= 57) /* 9 */ ||
		(byte >= 65 /* A */ && byte <= 90) /* Z */ ||
		(byte >= 97 /* a */ && byte <= 122) /* z */ ||
		byte === 58 /* : */ ||
		byte === 95 /* _ */ ||
		byte === 45 /* - */ ||
		byte === 46 /* . */
	);
}
