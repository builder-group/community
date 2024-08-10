/**
 * Represents a single segment of a XPath expression.
 *
 * This interface allows for constructing XPath expressions in a object-oriented way,
 * avoiding the complexities of parsing a full XPath string.
 * If parsing a full XPath becomes necessary in the future, a tool like [Peggy](https://github.com/peggyjs/peggy)
 * could be used to facilitate the process.
 *
 * https://www.w3.org/TR/xpath-31/
 *
 * @example
 * // Represents the XPath expression `/bookstore/book[@category='fiction'][1]`
 * const xpathExpr: TXPathExpr = [
 *   \{ axis: '/', name: 'bookstore' \},
 *   \{
 *     axis: '/',
 *     name: 'book',
 *     predicate: \{ attribute: 'category', value: 'fiction' \},
 *     position: 1,
 *     attributes: ['category', 'lang'] // Selects the 'category' and 'lang' attributes
 *   \}
 * ];
 */
export interface TTokenSelectPathPart {
	/**
	 * The axis defining the relationship between nodes.
	 * '/' represents the child axis (direct child).
	 * '//' represents the descendant-or-self axis (any level).
	 */
	axis: '/' | '//';

	/**
	 * The tag name of the node to match.
	 */
	local?: string | '*';

	/**
	 * An optional prefix (e.g. namespace) to qualify the node name.
	 */
	prefix?: string;

	/**
	 * An optional attribute-based filter.
	 *
	 * @example
	 * // Matches a book element with a category attribute equal to 'fiction'
	 * predicate: \{ attribute: 'category', value: 'fiction' \}
	 */
	attributes?: { local: string; prefix?: string; value?: string }[];

	// TODO:
	// /**
	//  * An optional position-based filter, like [1] to select the first occurrence.
	//  *
	//  * @example
	//  * // Matches the first book element in its context
	//  * position: 1
	//  */
	// position?: number;

	/**
	 * An optional text content matcher.
	 *
	 * @example
	 * // Matches elements containing the text 'bestseller'
	 * textContains: 'bestseller'
	 */
	textContains?: string;

	// TODO:
	predicate?: (node: any) => boolean;
}

/**
 * Represents an entire XPath expression composed of multiple parts.
 * The expression is an array of `TXPathPart` objects, each defining
 * a segment of the XPath.
 */
export type TTokenSelectPath = TTokenSelectPathPart[];
