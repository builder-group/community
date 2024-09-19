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
export const CLOSE_BRACKET = 93; // [
export const UNDERSCORE = 95; // _
export const LOWERCASE_A = 97; // a
export const LOWERCASE_F = 102; // f
export const LOWERCASE_X = 120; // x
export const LOWERCASE_Z = 122; // z

export function isAsciiDigit(byte: number): boolean {
	return byte >= ZERO && byte <= NINE;
}

/**
 * Checks if the character is within the NameStartChar range.
 * @param c - The character to check.
 * @returns True if the character is a valid XML name start character, false otherwise.
 */
export function isXmlNameStart(c: string | number): boolean {
	const code = typeof c === 'string' ? c.codePointAt(0) : c;
	if (code == null) {
		return false;
	}

	// Check for ASCII first
	if (code <= 128) {
		return (
			(code >= UPPERCASE_A && code <= UPPERCASE_Z) ||
			(code >= LOWERCASE_A && code <= LOWERCASE_Z) ||
			code === COLON ||
			code === UNDERSCORE
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
export function isXmlChar(c: string | number): boolean {
	const code = typeof c === 'string' ? c.codePointAt(0) : c;
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
		byte === SPACE || byte === HORIZONTAL_TAB || byte === LINE_FEED || byte === CARRIAGE_RETURN
	);
}

/**
 * Checks if the byte is within the ASCII Char range.
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
