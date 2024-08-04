import { type TTextPos } from './tokenizer/types';

export enum XMLErrorVariant {
	// The `xmlns:xml` attribute must have an <http://www.w3.org/XML/1998/namespace> URI.
	InvalidXmlPrefixUri = 'InvalidXmlPrefixUri',

	// Only the `xmlns:xml` attribute can have the <http://www.w3.org/XML/1998/namespace> URI.
	UnexpectedXmlUri = 'UnexpectedXmlUri',

	// The <http://www.w3.org/2000/xmlns/> URI must not be declared.
	UnexpectedXmlnsUri = 'UnexpectedXmlnsUri',

	// `xmlns` can't be used as an element prefix.
	InvalidElementNamePrefix = 'InvalidElementNamePrefix',

	// A namespace was already defined on this element.
	DuplicatedNamespace = 'DuplicatedNamespace',

	// An unknown namespace.
	// Indicates that an element or an attribute has an unknown qualified name prefix.
	// The first value is a prefix.
	UnknownNamespace = 'UnknownNamespace',

	// Incorrect tree structure.
	// expected, actual, position
	UnexpectedCloseTag = 'UnexpectedCloseTag',

	// Entity value starts with a close tag.
	// Example:
	// ```xml
	// <!DOCTYPE test [ <!ENTITY p '</p>'> ]>
	// <root>&p;</root>
	// ```
	UnexpectedEntityCloseTag = 'UnexpectedEntityCloseTag',

	// A reference to an entity that was not defined in the DTD.
	UnknownEntityReference = 'UnknownEntityReference',

	// A malformed entity reference.
	// A `&` character inside an attribute value or text indicates an entity reference.
	// Otherwise, the document is not well-formed.
	MalformedEntityReference = 'MalformedEntityReference',

	// A possible entity reference loop.
	// The current depth limit is 10. The max number of references per reference is 255.
	EntityReferenceLoop = 'EntityReferenceLoop',

	// Attribute value cannot have a `<` character.
	InvalidAttributeValue = 'InvalidAttributeValue',

	// An element has duplicated attributes.
	// This also includes namespaces resolving.
	// So an element like this will lead to an error.
	// ```xml
	// <e xmlns:n1='http://www.w3.org' xmlns:n2='http://www.w3.org' n1:a='b1' n2:a='b2'/>
	// ```
	DuplicatedAttribute = 'DuplicatedAttribute',

	// The XML document must have at least one element.
	NoRootNode = 'NoRootNode',

	// The root node was opened but never closed.
	UnclosedRootNode = 'UnclosedRootNode',

	// An XML document can have only one XML declaration
	// and it must be at the start of the document.
	UnexpectedDeclaration = 'UnexpectedDeclaration',

	// An XML with DTD detected.
	// This error will be emitted only when `ParsingOptions::allow_dtd` is set to `false`.
	DtdDetected = 'DtdDetected',

	// Indicates that the [`ParsingOptions::nodes_limit`] was reached.
	NodesLimitReached = 'NodesLimitReached',

	// Indicates that too many attributes were parsed.
	AttributesLimitReached = 'AttributesLimitReached',

	// Indicates that too many namespaces were parsed.
	NamespacesLimitReached = 'NamespacesLimitReached',

	// An invalid name.
	InvalidName = 'InvalidName',

	// A non-XML character has occurred.
	// Valid characters are: <https://www.w3.org/TR/xml/#char32>
	NonXmlChar = 'NonXmlChar',

	// An invalid/unexpected character.
	// expected, actual, position
	InvalidChar = 'InvalidChar',

	// An unexpected string.
	// Contains what string was expected.
	InvalidString = 'InvalidString',

	// An invalid ExternalID in the DTD.
	InvalidExternalID = 'InvalidExternalID',

	// A comment cannot contain `--` or end with `-`.
	InvalidComment = 'InvalidComment',

	// A Character Data node contains invalid data.
	// Currently, only `]]>` is not allowed.
	InvalidCharacterData = 'InvalidCharacterData',

	// An unknown token.
	UnknownToken = 'UnknownToken',

	// The stream ended earlier than we expected.
	// Should only appear on invalid input data.
	UnexpectedEndOfStream = 'UnexpectedEndOfStream'
}

export class XmlError extends Error {
	public readonly variant: XMLErrorVariant;
	public readonly pos: TTextPos;

	constructor(variant: XMLErrorVariant, message: string, pos: TTextPos = { col: 1, row: 1 }) {
		super(message);
		this.variant = variant;
		this.pos = pos;
	}
}
