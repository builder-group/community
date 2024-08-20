import { type TXmlToken } from '../tokenizer';

export type TSelectedXmlToken = (
	| TXmlToken
	| { type: 'SelectionStart' }
	| { type: 'SelectionEnd' }
) & { key?: string };

export type TSelectedTokenCallback = (token: TSelectedXmlToken) => void;

/**
 * A limited segment of an XPath expression in an object-oriented manner.
 *
 * @example
 * // Represents the XPath expression `/bookstore/book[@category='fiction'][1]`
 * const xpathExpr: TTokenSelectPath = [
 *   \{ axis: '/', local: 'bookstore' \},
 *   \{
 *     axis: '/',
 *     local: 'book',
 *     attributes: [\{ local: 'category', value: 'fiction' \}],
 *     position: 1
 *   \}
 * ];
 */
// If a string-based XPath implementation is wished,
// tools like [Peggy](https://github.com/peggyjs/peggy) could be utilized.
export interface TTokenSelectPathSegment {
	key?: string;

	/**
	 * Specifies the axis defining the relationship between nodes.
	 *
	 * - 'child' ('/'): Selects all children of the current node
	 * - 'self-or-descendant' ('//'): 	Selects all descendants (children, grandchildren, etc.) of the current node and the current node itself
	 */
	axis: 'child' | 'self-or-descendant';

	/**
	 * Optional local name of the node to match.
	 */
	local?: TStringMatch;

	/**
	 * Optional namespace prefix to qualify the node name.
	 */
	prefix?: TStringMatch;

	/**
	 * Optional filters based on node attributes.
	 *
	 * @example
	 * // Matches a node with an attribute 'category' equal to 'fiction'
	 * attributes: [\{ local: 'category', value: 'fiction' \}]
	 */
	attributes?: { local?: TStringMatch; prefix?: TStringMatch; value?: TStringMatch }[];

	/**
	 * Optional filter to match nodes containing specific text content.
	 *
	 * Currenlty only plain text can be matched.
	 * Text with sub nodes like <b/>, <strong/> can't be matched as of now.
	 *
	 * @example
	 * // Matches nodes containing the text 'bestseller'
	 * containsText: 'bestseller'
	 */
	text?: TStringMatch;

	/**
	 * Optional custom predicate function to further filter nodes.
	 *
	 * @example
	 * // Custom predicate to match nodes with specific characteristics
	 * predicate: (node) =\> node.local === 'title'
	 */
	predicate?: (node: {
		local: string;
		prefix?: string;
		attributes: Record<string, string>;
		text?: string;
	}) => boolean;
}

/**
 * A limited XPath expression composed of multiple segments in an object-oriented manner.
 */
export type TTokenSelectPath = TTokenSelectPathSegment[];

export type TStringMatchStrategy = 'EXACT' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'ANY';

export type TStringMatch =
	| string
	| { matchStrategy: 'ANY' }
	| {
			matchStrategy: Exclude<TStringMatchStrategy, 'ANY'>;
			value: string;
	  };
