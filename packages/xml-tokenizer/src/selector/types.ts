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
	/**
	 * Specifies the axis defining the relationship between nodes.
	 *
	 * - 'child' ('/'): Selects all children of the current node
	 * - 'self-or-descendant' ('//'): 	Selects all descendants (children, grandchildren, etc.) of the current node and the current node itself
	 */
	axis: 'child' | 'self-or-descendant';

	/**
	 * The local name of the node to match.
	 *
	 * Use '*' to match any node.
	 */
	local?: string | '*';

	/**
	 * An optional namespace prefix to qualify the node name.
	 */
	prefix?: string;

	/**
	 * Optional filters based on node attributes.
	 *
	 * @example
	 * // Matches a node with an attribute 'category' equal to 'fiction'
	 * attributes: [\{ local: 'category', value: 'fiction' \}]
	 */
	attributes?: { local: string; prefix?: string; value?: string }[];

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
	containsText?: string;

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

// TODO: Add actual selectors?

// export interface TTokenSelectTemplate {
// 	path: TTokenSelectPath;
// 	select: Record<string, TTokenSelectItem>;
// }

// export type TTokenSelectItem = TSelectAttributeItem | TSelectTextItem | TSelectRawTextItem;

// export interface TSelectAttributeItem {
// 	type: 'Attribute';
// 	local: string;
// 	prefix?: string;
// 	value?: string;
// }

// export interface TSelectTextItem {
// 	type: 'Text';
// }

// export interface TSelectRawTextItem {
// 	type: 'Raw';
// }
