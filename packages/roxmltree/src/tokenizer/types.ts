import { type StrSpan } from './StrSpan';

export interface TXmlEvents {
	token: (token: TXMLToken) => void;
}

/**
 * A Processing Instruction token.
 *
 * \<?target content?\>
 */
export interface TProcessingInstructionToken {
	type: 'ProcessingInstruction';
	target: string;
	content?: string;
	range: TRange;
}

/**
 * A Comment token.
 *
 * \<!-- text --\>
 */
export interface TCommentToken {
	type: 'Comment';
	text: string;
	range: TRange;
}

/**
 * An Entity Declaration token.
 *
 * \<!ENTITY ns_extend "http://test.com"\>
 */
export interface TEntityDeclarationToken {
	type: 'EntityDeclaration';
	name: string;
	definition: StrSpan;
}

/**
 * An Element Start token.
 *
 * \<ns:elem
 */
export interface TElementStartToken {
	type: 'ElementStart';
	prefix: string;
	local: string;
	startPos: number;
}

/**
 * An Attribute token.
 *
 * ns:attr="value"
 */
export interface TAttributeToken {
	type: 'Attribute';
	range: TRange;
	prefix: string;
	local: string;
	value: StrSpan;
}

/**
 * An Element End token.
 */
export interface TElementEndToken {
	type: 'ElementEnd';
	end: TElementEndVariant;
	range: TRange;
}

export type TElementEndVariant =
	// Indicates `>`
	| { type: 'Open' }
	// Indicates `</ns:name>`
	| { type: 'Close'; prefix: string; local: string }
	// Indicates `/>`
	| { type: 'Empty' };

/**
 * A Text token.
 *
 * Contains text between elements including whitespaces.
 * Basically everything between `>` and `<`.
 * Except `]]>`, which is not allowed and will lead to an error.
 */
export interface TTextToken {
	type: 'Text';
	text: string;
	range: TRange;
}

/**
 * A CDATA Section token.
 *
 * \<![CDATA[text]]\>
 */
export interface TCdataToken {
	type: 'Cdata';
	text: string;
	range: TRange;
}

export type TXMLToken =
	| TProcessingInstructionToken
	| TCommentToken
	| TEntityDeclarationToken
	| TElementStartToken
	| TAttributeToken
	| TElementEndToken
	| TTextToken
	| TCdataToken;

export type TRange = [number, number];

export interface TTextPos {
	row: number;
	col: number;
}

/**
 * Representation of the [Reference](https://www.w3.org/TR/xml/#NT-Reference) value.
 */
export type TReference =
	/**
	 * An entity reference.
	 *
	 * https://www.w3.org/TR/xml/#NT-EntityRef
	 */
	| { type: 'Char'; value: string }

	/**
	 * A character reference.
	 *
	 * https://www.w3.org/TR/xml/#NT-CharRef
	 */
	| { type: 'Entity'; value: string };
