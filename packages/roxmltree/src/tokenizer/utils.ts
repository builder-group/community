export const HORIZONTAL_TAB = 9; // \t
export const LINE_FEED = 10; // \n
export const CARRIAGE_RETURN = 13; // \r
export const SPACE = 32; // ' '
export const EXCLAMATION_MARK = 33; // !
export const DOUBLE_QUOTE = 34; // "
export const HASH = 35; // #
export const PERCENT = 37; // %
export const AMPERSAND = 38; // &
export const SINGLE_QUOTE = 39; // '
export const HYPHEN = 45; // -
export const PERIOD = 46; // .
export const SLASH = 47; // /
export const ZERO = 48; // 0
export const NINE = 57; // 9
export const COLON = 58; // :
export const SEMICOLON = 59; // ;
export const LESS_THAN = 60; // <
export const EQUALS = 61; // =
export const GREATER_THAN = 62; // >
export const QUESTION_MARK = 63; // ?
export const UPPERCASE_A = 65; // A
export const UPPERCASE_F = 70; // F
export const UPPERCASE_P = 80; // P
export const UPPERCASE_S = 83; // S
export const UPPERCASE_Z = 90; // Z
export const OPEN_BRACKET = 91; // [
export const UNDERSCORE = 95; // _
export const LOWERCASE_A = 97; // a
export const LOWERCASE_F = 102; // f
export const LOWERCASE_X = 120; // x
export const LOWERCASE_Z = 122; // z

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
