import {
	CARRIAGE_RETURN,
	COLON,
	HORIZONTAL_TAB,
	HYPHEN,
	LINE_FEED,
	LOWERCASE_A,
	LOWERCASE_Z,
	NINE,
	PERIOD,
	SPACE,
	UNDERSCORE,
	UPPERCASE_A,
	UPPERCASE_Z,
	ZERO
} from './ascii-constants';

export function isAsciiDigit(byte: number): boolean {
	return byte >= ZERO && byte <= NINE;
}

/**
 * Checks if the unicode code point (character) is within the name start char range.
 *
 * @param codePoint - The character to check.
 * @returns True if the character is a valid XML name start character, false otherwise.
 */
export function isXmlNameStart(codePoint: number | undefined): boolean {
	if (codePoint == null) {
		return false;
	}

	// Check for ASCII first
	if (codePoint <= 128) {
		return (
			(codePoint >= UPPERCASE_A && codePoint <= UPPERCASE_Z) ||
			(codePoint >= LOWERCASE_A && codePoint <= LOWERCASE_Z) ||
			codePoint === COLON ||
			codePoint === UNDERSCORE
		);
	}

	return (
		(codePoint >= 0xc0 && codePoint <= 0xd6) ||
		(codePoint >= 0xd8 && codePoint <= 0xf6) ||
		(codePoint >= 0xf8 && codePoint <= 0x2ff) ||
		(codePoint >= 0x370 && codePoint <= 0x37d) ||
		(codePoint >= 0x37f && codePoint <= 0x1fff) ||
		(codePoint >= 0x200c && codePoint <= 0x200d) ||
		(codePoint >= 0x2070 && codePoint <= 0x218f) ||
		(codePoint >= 0x2c00 && codePoint <= 0x2fef) ||
		(codePoint >= 0x3001 && codePoint <= 0xd7ff) ||
		(codePoint >= 0xf900 && codePoint <= 0xfdcf) ||
		(codePoint >= 0xfdf0 && codePoint <= 0xfffd) ||
		(codePoint >= 0x10000 && codePoint <= 0xeffff)
	);
}

/**
 * Checks if the unicode code point (character) is within the XML name char range.
 *
 * @param codePoint - The character to check.
 * @returns True if the character is a valid XML name character, false otherwise.
 */
export function isXmlName(codePoint: number | undefined): boolean {
	if (codePoint == null) {
		return false;
	}

	// Check for ASCII first
	if (codePoint <= 128) {
		return isXmlNameByte(codePoint);
	}

	return (
		codePoint === 0xb7 ||
		(codePoint >= 0xc0 && codePoint <= 0xd6) ||
		(codePoint >= 0xd8 && codePoint <= 0xf6) ||
		(codePoint >= 0xf8 && codePoint <= 0x2ff) ||
		(codePoint >= 0x300 && codePoint <= 0x36f) ||
		(codePoint >= 0x370 && codePoint <= 0x37d) ||
		(codePoint >= 0x37f && codePoint <= 0x1fff) ||
		(codePoint >= 0x200c && codePoint <= 0x200d) ||
		(codePoint >= 0x203f && codePoint <= 0x2040) ||
		(codePoint >= 0x2070 && codePoint <= 0x218f) ||
		(codePoint >= 0x2c00 && codePoint <= 0x2fef) ||
		(codePoint >= 0x3001 && codePoint <= 0xd7ff) ||
		(codePoint >= 0xf900 && codePoint <= 0xfdcf) ||
		(codePoint >= 0xfdf0 && codePoint <= 0xfffd) ||
		(codePoint >= 0x10000 && codePoint <= 0xeffff)
	);
}

/**
 * Checks if the unicode code point (character) is within the XML char range.
 *
 * @param codePoint - The character to check.
 * @returns True if the character is a valid XML character, false otherwise.
 */
export function isXmlChar(codePoint: number | undefined): boolean {
	if (codePoint == null) {
		return false;
	}

	if (codePoint < 0x20) {
		return isXmlSpaceByte(codePoint);
	}

	return codePoint !== 0xffff && codePoint !== 0xfffe;
}

/**
 * Checks if the character is an XML space.
 *
 * @param byte - The byte to check.
 * @returns True if the byte is a valid XML space, false otherwise.
 */
export function isXmlSpaceByte(byte: number): boolean {
	return (
		byte === SPACE || byte === HORIZONTAL_TAB || byte === LINE_FEED || byte === CARRIAGE_RETURN
	);
}

/**
 * Checks if the byte is within the ASCII char range.
 *
 * @param byte - The byte to check.
 * @returns True if the byte is a valid ASCII XML name character, false otherwise.
 */
export function isXmlNameByte(byte: number): boolean {
	return (
		(byte >= ZERO && byte <= NINE) ||
		(byte >= UPPERCASE_A && byte <= UPPERCASE_Z) ||
		(byte >= LOWERCASE_A && byte <= LOWERCASE_Z) ||
		byte === COLON ||
		byte === UNDERSCORE ||
		byte === HYPHEN ||
		byte === PERIOD
	);
}
