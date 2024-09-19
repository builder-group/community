import { type TTextPos } from './types';

export class XmlError extends Error {
	public readonly variant: TXMLErrorVariant;
	public readonly pos: TTextPos;

	constructor(variant: TXMLErrorVariant, pos: TTextPos = { col: 1, row: 1 }, message?: string) {
		super(message ?? XmlError.toMessage(variant, pos));
		this.variant = variant;
		this.pos = pos;
	}

	static toMessage(variant: TXMLErrorVariant, pos: TTextPos): string {
		switch (variant.type) {
			case 'InvalidXmlPrefixUri':
				return `'xml' namespace prefix mapped to wrong URI at ${formatPos(pos)}`;
			case 'UnexpectedXmlUri':
				return `the 'xml' namespace URI is used for not 'xml' prefix at ${formatPos(pos)}`;
			case 'UnexpectedXmlnsUri':
				return `the 'xmlns' URI is used at ${formatPos(pos)}, but it must not be declared`;
			case 'InvalidElementNamePrefix':
				return `the 'xmlns' prefix is used at ${formatPos(pos)}, but it must not be`;
			case 'DuplicatedNamespace':
				return `namespace '${variant.name}' at ${formatPos(pos)} is already defined`;
			case 'UnknownNamespace':
				return `an unknown namespace prefix '${variant.name}' at ${formatPos(pos)}`;
			case 'UnexpectedCloseTag':
				return `expected '${variant.expected}' tag, not '${variant.actual}' at ${formatPos(pos)}`;
			case 'UnexpectedEntityCloseTag':
				return `unexpected close tag at ${formatPos(pos)}`;
			case 'MalformedEntityReference':
				return `malformed entity reference at ${formatPos(pos)}`;
			case 'UnknownEntityReference':
				return `unknown entity reference '${variant.name}' at ${formatPos(pos)}`;
			case 'EntityReferenceLoop':
				return `a possible entity reference loop is detected at ${formatPos(pos)}`;
			case 'InvalidAttributeValue':
				return `unescaped '<' found at ${formatPos(pos)}`;
			case 'DuplicatedAttribute':
				return `attribute '${variant.attribute}' at ${formatPos(pos)} is already defined`;
			case 'NoRootNode':
				return `the document does not have a root node`;
			case 'UnclosedRootNode':
				return `the root node was opened but never closed`;
			case 'UnexpectedDeclaration':
				return `unexpected XML declaration at ${formatPos(pos)}`;
			case 'DtdDetected':
				return `XML with DTD detected`;
			case 'NodesLimitReached':
				return `nodes limit reached`;
			case 'AttributesLimitReached':
				return `more than 2^32 attributes were parsed`;
			case 'NamespacesLimitReached':
				return `more than 2^16 unique namespaces were parsed`;
			case 'InvalidName':
				return `invalid name token at ${formatPos(pos)}`;
			case 'NonXmlChar':
				return `a non-XML character '${toUnicodeEscape(variant.char)}' found at ${formatPos(pos)}`;
			case 'InvalidChar':
				return `expected ${typeof variant.expected === 'string' ? variant.expected : `'${toUnicodeEscape(variant.expected)}'`} not '${toUnicodeEscape(variant.actual)}' at ${formatPos(pos)}`;
			case 'InvalidString':
				return `expected '${variant.expected}' at ${formatPos(pos)}`;
			case 'InvalidExternalID':
				return `invalid ExternalID at ${formatPos(pos)}`;
			case 'InvalidComment':
				return `comment at ${formatPos(pos)} contains '--'`;
			case 'InvalidCharacterData':
				return `']]>' at ${formatPos(pos)} is not allowed inside a character data`;
			case 'UnknownToken':
				return `unknown token at ${formatPos(pos)}`;
			case 'UnexpectedEndOfStream':
				return `unexpected end of stream`;
			default:
				return `unknown error type`;
		}
	}
}

function formatPos(pos: TTextPos): string {
	return `${pos.row.toString()}:${pos.col.toString()}`;
}

function toUnicodeEscape(codePoint: number | string): string {
	const code = typeof codePoint === 'string' ? codePoint.charCodeAt(0) : codePoint;
	if (code < 0 || code > 0x10ffff) {
		throw new Error('Code point out of range');
	}

	// Convert to hexadecimal string with leading zeros
	let hexString = code.toString(16).toUpperCase();
	if (code <= 0xffff) {
		hexString = hexString.padStart(4, '0');
	} else {
		hexString = hexString.padStart(6, '0');
	}

	// Format with Unicode escape sequence
	return `\\u{${hexString}}`;
}

type TXMLErrorVariant =
	| TInvalidXmlPrefixUri
	| TUnexpectedXmlUri
	| TUnexpectedXmlnsUri
	| TInvalidElementNamePrefix
	| TDuplicatedNamespace
	| TUnknownNamespace
	| TUnexpectedCloseTag
	| TUnexpectedEntityCloseTag
	| TUnknownEntityReference
	| TMalformedEntityReference
	| TEntityReferenceLoop
	| TInvalidAttributeValue
	| TDuplicatedAttribute
	| TNoRootNode
	| TUnclosedRootNode
	| TUnexpectedDeclaration
	| TDtdDetected
	| TNodesLimitReached
	| TAttributesLimitReached
	| TNamespacesLimitReached
	| TInvalidName
	| TNonXmlChar
	| TInvalidChar
	| TInvalidString
	| TInvalidExternalID
	| TInvalidComment
	| TInvalidCharacterData
	| TUnknownToken
	| TUnexpectedEndOfStream;

/**
 * The `xmlns:xml` attribute must have an \<http://www.w3.org/XML/1998/namespace\> URI.
 */
interface TInvalidXmlPrefixUri {
	type: 'InvalidXmlPrefixUri';
}

/**
 * Only the `xmlns:xml` attribute can have the \<http://www.w3.org/XML/1998/namespace\> URI.
 */
interface TUnexpectedXmlUri {
	type: 'UnexpectedXmlUri';
}

/**
 * The \<http://www.w3.org/2000/xmlns/\> URI must not be declared.
 */
interface TUnexpectedXmlnsUri {
	type: 'UnexpectedXmlnsUri';
}

/**
 * `xmlns` can't be used as an element prefix.
 */
interface TInvalidElementNamePrefix {
	type: 'InvalidElementNamePrefix';
}

/**
 * A namespace was already defined on this element.
 */
interface TDuplicatedNamespace {
	type: 'DuplicatedNamespace';
	name: string;
}

/**
 * An unknown namespace.
 *
 * Indicates that an element or an attribute has an unknown qualified name prefix.
 *
 * The first value is a prefix.
 */
interface TUnknownNamespace {
	type: 'UnknownNamespace';
	name: string;
}

/**
 * Incorrect tree structure.
 *
 * expected, actual, position
 */
interface TUnexpectedCloseTag {
	type: 'UnexpectedCloseTag';
	expected: string;
	actual: string;
}

/**
 * Entity value starts with a close tag.
 *
 * Example:
 * ```xml
 * <!DOCTYPE test [ <!ENTITY p '</p>'> ]>
 * <root>&p;</root>
 * ```
 */
interface TUnexpectedEntityCloseTag {
	type: 'UnexpectedEntityCloseTag';
}

/**
 * A reference to an entity that was not defined in the DTD.
 */
interface TUnknownEntityReference {
	type: 'UnknownEntityReference';
	name: string;
}

/**
 * A malformed entity reference.
 *
 * A `&` character inside an attribute value or text indicates an entity reference.
 * Otherwise, the document is not well-formed.
 */
interface TMalformedEntityReference {
	type: 'MalformedEntityReference';
}

/**
 * A possible entity reference loop.
 *
 * The current depth limit is 10. The max number of references per reference is 255.
 */
interface TEntityReferenceLoop {
	type: 'EntityReferenceLoop';
}

/**
 * Attribute value cannot have a `<` character.
 */
interface TInvalidAttributeValue {
	type: 'InvalidAttributeValue';
}

/**
 * An element has duplicated attributes.
 *
 * This also includes namespaces resolving.
 * So an element like this will lead to an error.
 * ```xml
 * <e xmlns:n1='http://www.w3.org' xmlns:n2='http://www.w3.org' n1:a='b1' n2:a='b2'/>
 * ```
 */
interface TDuplicatedAttribute {
	type: 'DuplicatedAttribute';
	attribute: string;
}

/**
 * The XML document must have at least one element.
 */
interface TNoRootNode {
	type: 'NoRootNode';
}

/**
 * The root node was opened but never closed.
 */
interface TUnclosedRootNode {
	type: 'UnclosedRootNode';
}

/**
 * An XML document can have only one XML declaration
 * and it must be at the start of the document.
 */
interface TUnexpectedDeclaration {
	type: 'UnexpectedDeclaration';
}

/**
 * An XML with DTD detected.
 *
 * This error will be emitted only when `ParsingOptions::allow_dtd` is set to `false`.
 */
interface TDtdDetected {
	type: 'DtdDetected';
}

/**
 * Indicates that the `ParsingOptions::nodes_limit` was reached.
 */
interface TNodesLimitReached {
	type: 'NodesLimitReached';
}

/**
 * Indicates that too many attributes were parsed.
 */
interface TAttributesLimitReached {
	type: 'AttributesLimitReached';
}

/**
 * Indicates that too many namespaces were parsed.
 */
interface TNamespacesLimitReached {
	type: 'NamespacesLimitReached';
}

/**
 * An invalid name.
 */
interface TInvalidName {
	type: 'InvalidName';
}

/**
 * A non-XML character has occurred.
 *
 * Valid characters are: \<https://www.w3.org/TR/xml/#char32\>
 */
interface TNonXmlChar {
	type: 'NonXmlChar';
	char: string;
}

/**
 * An invalid/unexpected character.
 *
 * expected, actual, position
 */
interface TInvalidChar {
	type: 'InvalidChar';
	expected: string | number;
	actual: number;
}

/**
 * An unexpected string.
 *
 * Contains what string was expected.
 */
interface TInvalidString {
	type: 'InvalidString';
	expected: string;
}

/**
 * An invalid ExternalID in the DTD.
 */
interface TInvalidExternalID {
	type: 'InvalidExternalID';
}

/**
 * A comment cannot contain `--` or end with `-`.
 */
interface TInvalidComment {
	type: 'InvalidComment';
}

/**
 * A Character Data node contains invalid data.
 *
 * Currently, only `]]>` is not allowed.
 */
interface TInvalidCharacterData {
	type: 'InvalidCharacterData';
}

/**
 * An unknown token.
 */
interface TUnknownToken {
	type: 'UnknownToken';
	message?: string;
}

/**
 * The stream ended earlier than we expected.
 *
 * Should only appear on invalid input data.
 */
interface TUnexpectedEndOfStream {
	type: 'UnexpectedEndOfStream';
}
