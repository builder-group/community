import { type TRange, type TReference, type TTextPos } from '../types';

/**
 * Represents a stream of characters for parsing XML-like content.
 *
 * Unlike the Rust implementation, which is based on bytes, this implementation
 * is based on code units for simplicity.
 */
export interface TXmlStream {
	/**
	 * Creates a clone of the current stream.
	 * @returns A new instance of IXmlStream with the same state.
	 */
	clone: () => TXmlStream;

	/**
	 * Gets the current position in the stream.
	 * @returns The current position.
	 */
	getPos: () => number;

	/**
	 * Checks if the stream is at the end.
	 * @returns True if at the end, false otherwise.
	 */
	atEnd: () => boolean;

	/**
	 * Gets the current byte (character code) in the stream.
	 * @returns The current byte or null if at the end.
	 * @throws XmlError if at the end of the stream.
	 */
	currByte: () => number;

	/**
	 * Gets the current byte (character code) without checking for the end.
	 * @returns The current byte.
	 */
	currByteUnchecked: () => number;

	/**
	 * Gets the next byte (character code) in the stream.
	 * @returns The next byte or null if at the end.
	 * @throws XmlError if at the end of the stream.
	 */
	nextByte: () => number;

	/**
	 * Advances the stream position by the specified number of characters.
	 * @param n - The number of characters to advance.
	 */
	advance: (n: number) => void;

	/**
	 * Checks if the stream starts with the given text.
	 * @param text - The text to check.
	 * @returns True if the stream starts with the text, false otherwise.
	 */
	startsWith: (text: Uint8Array) => boolean;

	/**
	 * Consumes a specific byte (character) from the stream.
	 * @param c - The byte to consume.
	 * @throws XmlError if the current byte doesn't match or if at the end.
	 */
	consumeByte: (c: number) => void;

	/**
	 * Tries to consume a specific byte (character) from the stream.
	 * Unlike `consumeByte`, it will not throw any errors.
	 * @param c - The byte to consume.
	 * @returns True if the byte was consumed, false otherwise.
	 */
	tryConsumeByte: (c: number) => boolean;

	/**
	 * Consumes bytes that satisfy a predicate function.
	 * @param predicate - The function to test each byte.
	 * @returns The consumed string.
	 */
	consumeBytesWhile: (predicate: (stream: TXmlStream, byte: number) => boolean) => Uint8Array;

	/**
	 * Skips bytes that satisfy a predicate function.
	 * @param predicate - The function to test each byte.
	 */
	skipBytesWhile: (predicate: (stream: TXmlStream, byte: number) => boolean) => void;

	skipBytes: (bytes: Uint8Array) => void;

	/**
	 * Slices the text from the given position to the current position.
	 * @param pos - The start position.
	 * @returns The sliced string.
	 */
	sliceBack: (pos: number) => Uint8Array;

	/**
	 * Creates a range from the given start position to the current position.
	 * @param start - The start position.
	 * @returns The range object.
	 */
	rangeFrom: (start: number) => TRange;

	/**
	 * Skips whitespace characters in the stream.
	 */
	skipSpaces: () => void;

	/**
	 * Checks if the stream starts with a whitespace character.
	 * @returns True if it starts with a whitespace, false otherwise.
	 */
	startsWithSpace: () => boolean;

	/**
	 * Consumes whitespace characters in the stream.
	 * Like `skipSpaces`, but checks that the first char is actually a space.
	 * @throws XmlError if the stream doesn't start with a whitespace or is at the end.
	 */
	consumeSpaces: () => void;

	/**
	 * Tries to consume a reference (entity or character reference).
	 * Consumes according to: https://www.w3.org/TR/xml/#NT-Reference
	 * @returns The consumed reference or null if not a reference.
	 */
	tryConsumeReference: () => TReference | null;

	/**
	 * Consumes a reference (entity or character reference).
	 * @returns The consumed reference or null if not a reference.
	 */
	consumeReference: () => TReference | null;

	/**
	 * Consumes an XML name.
	 * Consumes according to: https://www.w3.org/TR/xml/#NT-Name
	 * @returns The consumed name.
	 * @throws XmlError if an invalid name is encountered.
	 */
	consumeName: () => Uint8Array;

	/**
	 * Skips an XML name.
	 * The same as `consumeName`, but does not return the consumed name.
	 * @throws XmlError if an invalid name is encountered.
	 */
	skipName: () => void;

	/**
	 * Consumes a qualified XML name and returns it.
	 * Consumes according to: https://www.w3.org/TR/xml-names/#ns-qualnames
	 * @returns The prefix and local name as a tuple.
	 * @throws XmlError if an invalid qualified XML name is encountered.
	 */
	consumeQName: () => [Uint8Array, Uint8Array];

	/**
	 * Consumes an equal sign, surrounded by optional whitespace.
	 */
	consumeEq: () => void;

	/**
	 * Consumes a quote character.
	 * @returns The consumed quote character.
	 * @throws XmlError if an invalid quote character is encountered.
	 */
	consumeQuote: () => number;

	/**
	 * Calculates the current absolute position.
	 * This operation is very expensive. Use only for errors.
	 * @returns The current text position.
	 */
	genTextPos: () => TTextPos;

	/**
	 * Calculates an absolute position at the specified position.
	 * This operation is very expensive. Use only for errors.
	 * @param pos - The position to calculate from.
	 * @returns The calculated text position.
	 */
	genTextPosFrom: (pos: number) => TTextPos;
}
