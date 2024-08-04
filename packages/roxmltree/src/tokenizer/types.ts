import { type StrSpan } from './StrSpan';

export interface TXmlEvents {
	token: (token: TToken) => void;
}

export type TToken =
	// <?target content?>
	| { type: 'ProcessingInstruction'; target: string; content?: string; range: TRange }
	// <!-- text -->
	| { type: 'Comment'; text: string; range: TRange }
	// <!ENTITY ns_extend "http://test.com">
	| { type: 'EntityDeclaration'; name: string; definition: StrSpan }
	// <ns:elem
	| { type: 'ElementStart'; prefix: string; local: string; start: number }
	// ns:attr="value"
	| {
			type: 'Attribute';
			range: TRange;
			prefix: string;
			local: string;
			value: StrSpan;
	  }
	| { type: 'ElementEnd'; end: TElementEnd; range: TRange }
	// Contains text between elements including whitespaces.
	// Basically everything between `>` and `<`.
	// Except `]]>`, which is not allowed and will lead to an error.
	| { type: 'Text'; text: string; range: TRange }
	// <![CDATA[text]]>
	| { type: 'Cdata'; text: string; range: TRange };

export type TElementEnd =
	// Indicates `>`
	| { type: 'Open' }
	// Indicates `</ns:name>`
	| { type: 'Close'; prefix: string; name: string }
	// Indicates `/>`
	| { type: 'Empty' };

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
