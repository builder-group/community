/**
 * Represents a node in the XML/HTML structure
 */
export interface TNode {
	tagName: string;
	attributes: Record<string, string | null>;
	children: (TNode | string)[];
}

/**
 * Options for parsing XML/HTML
 */
export interface TParseOptions {
	pos?: number;
	noChildNodes?: string[];
	setPos?: boolean;
	keepComments?: boolean;
	keepWhitespace?: boolean;
	simplify?: boolean;
	filter?: (node: TNode, index: number, depth: number, path: string) => boolean;
	attrName?: string;
	attrValue?: string;
	parseNode?: boolean;
}

/**
 * Parses XML/HTML into a DOM Object with no validation and some failure tolerance
 * @param source The XML/HTML string to parse
 * @param options Parsing options
 * @returns An array of parsed nodes or strings
 */
export function parse(source: string, options: TParseOptions = {}): (TNode | string)[] {
	const {
		pos = 0,
		keepComments = false,
		keepWhitespace = false,
		noChildNodes = ['img', 'br', 'input', 'meta', 'link', 'hr']
	} = options;

	let currentPos = pos;

	const OPEN_BRACKET = '<'.charCodeAt(0);
	const CLOSE_BRACKET = '>'.charCodeAt(0);
	const MINUS = '-'.charCodeAt(0);
	const SLASH = '/'.charCodeAt(0);
	const EXCLAMATION = '!'.charCodeAt(0);
	const SINGLE_QUOTE = "'".charCodeAt(0);
	const DOUBLE_QUOTE = '"'.charCodeAt(0);
	const OPEN_CORNER_BRACKET = '['.charCodeAt(0);
	const CLOSE_CORNER_BRACKET = ']'.charCodeAt(0);

	function parseChildren(tagName: string): (TNode | string)[] {
		const children: (TNode | string)[] = [];
		while (source[currentPos]) {
			if (source.charCodeAt(currentPos) === OPEN_BRACKET) {
				if (source.charCodeAt(currentPos + 1) === SLASH) {
					const closeStart = currentPos + 2;
					currentPos = source.indexOf('>', currentPos);

					const closeTag = source.substring(closeStart, currentPos);
					if (closeTag.indexOf(tagName) === -1) {
						const parsedText = source.substring(0, currentPos).split('\n');
						throw new Error(
							`Unexpected close tag\nLine: ${parsedText.length - 1}\nColumn: ${parsedText[parsedText.length - 1].length + 1}\nChar: ${source[currentPos]}`
						);
					}

					if (currentPos + 1) currentPos += 1;

					return children;
				} else if (source.charCodeAt(currentPos + 1) === EXCLAMATION) {
					if (source.charCodeAt(currentPos + 2) === MINUS) {
						// Comment support
						const startCommentPos = currentPos;
						while (
							currentPos !== -1 &&
							!(
								source.charCodeAt(currentPos) === CLOSE_BRACKET &&
								source.charCodeAt(currentPos - 1) === MINUS &&
								source.charCodeAt(currentPos - 2) === MINUS
							)
						) {
							currentPos = source.indexOf('>', currentPos + 1);
						}
						if (currentPos === -1) {
							currentPos = source.length;
						}
						if (keepComments) {
							children.push(source.substring(startCommentPos, currentPos + 1));
						}
					} else if (
						source.charCodeAt(currentPos + 2) === OPEN_CORNER_BRACKET &&
						source.charCodeAt(currentPos + 8) === OPEN_CORNER_BRACKET &&
						source.substr(currentPos + 3, 5).toLowerCase() === 'cdata'
					) {
						// CDATA
						const cdataEndIndex = source.indexOf(']]>', currentPos);
						if (cdataEndIndex === -1) {
							children.push(source.substr(currentPos + 9));
							currentPos = source.length;
						} else {
							children.push(source.substring(currentPos + 9, cdataEndIndex));
							currentPos = cdataEndIndex + 3;
						}
						continue;
					} else {
						// Doctype support
						const startDoctype = currentPos + 1;
						currentPos += 2;
						let encapsulated = false;
						while (
							(source.charCodeAt(currentPos) !== CLOSE_BRACKET || encapsulated) &&
							source[currentPos]
						) {
							if (source.charCodeAt(currentPos) === OPEN_CORNER_BRACKET) {
								encapsulated = true;
							} else if (encapsulated && source.charCodeAt(currentPos) === CLOSE_CORNER_BRACKET) {
								encapsulated = false;
							}
							currentPos++;
						}
						children.push(source.substring(startDoctype, currentPos));
					}
					currentPos++;
					continue;
				}
				const node = parseNode();
				children.push(node);
				if (node.tagName[0] === '?') {
					children.push(...node.children);
					node.children = [];
				}
			} else {
				const text = parseText();
				if (keepWhitespace) {
					if (text.length > 0) {
						children.push(text);
					}
				} else {
					const trimmed = text.trim();
					if (trimmed.length > 0) {
						children.push(trimmed);
					}
				}
				currentPos++;
			}
		}
		return children;
	}

	function parseText(): string {
		const start = currentPos;
		currentPos = source.indexOf('<', currentPos) - 1;
		if (currentPos === -2) currentPos = source.length;
		return source.slice(start, currentPos + 1);
	}

	const NAME_SPACER = '\r\n\t>/= ';

	function parseName(): string {
		const start = currentPos;
		while (NAME_SPACER.indexOf(source[currentPos]) === -1 && source[currentPos]) {
			currentPos++;
		}
		return source.slice(start, currentPos);
	}

	function parseNode(): TNode {
		currentPos++;
		const tagName = parseName();
		const attributes: Record<string, string | null> = {};
		let children: (TNode | string)[] = [];

		// Parsing attributes
		while (source.charCodeAt(currentPos) !== CLOSE_BRACKET && source[currentPos]) {
			const c = source.charCodeAt(currentPos);
			if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
				const name = parseName();
				let code = source.charCodeAt(currentPos);
				while (
					code &&
					code !== SINGLE_QUOTE &&
					code !== DOUBLE_QUOTE &&
					!((code > 64 && code < 91) || (code > 96 && code < 123)) &&
					code !== CLOSE_BRACKET
				) {
					currentPos++;
					code = source.charCodeAt(currentPos);
				}
				let value: string | null;
				if (code === SINGLE_QUOTE || code === DOUBLE_QUOTE) {
					value = parseString();
					if (currentPos === -1) {
						return { tagName, attributes, children };
					}
				} else {
					value = null;
					currentPos--;
				}
				attributes[name] = value;
			}
			currentPos++;
		}

		// Optional parsing of children
		if (source.charCodeAt(currentPos - 1) !== SLASH) {
			if (tagName === 'script') {
				const start = currentPos + 1;
				currentPos = source.indexOf('</script>', currentPos);
				children = [source.slice(start, currentPos)];
				currentPos += 9;
			} else if (tagName === 'style') {
				const start = currentPos + 1;
				currentPos = source.indexOf('</style>', currentPos);
				children = [source.slice(start, currentPos)];
				currentPos += 8;
			} else if (noChildNodes.indexOf(tagName) === -1) {
				currentPos++;
				children = parseChildren(tagName);
			} else {
				currentPos++;
			}
		} else {
			currentPos++;
		}

		return { tagName, attributes, children };
	}

	function parseString(): string {
		const startChar = source[currentPos];
		const startPos = currentPos + 1;
		currentPos = source.indexOf(startChar, startPos);
		return source.slice(startPos, currentPos);
	}

	function findElements(): number {
		const regex = new RegExp(`\\s${options.attrName}\\s*=['"']${options.attrValue}['"']`);
		const match = regex.exec(source);
		return match ? match.index : -1;
	}

	let out: (TNode | string)[] | TNode | null = null;

	if (options.attrValue !== undefined) {
		options.attrName = options.attrName || 'id';
		out = [];

		let elementPos: number;
		while ((elementPos = findElements()) !== -1) {
			currentPos = source.lastIndexOf('<', elementPos);
			if (currentPos !== -1) {
				out.push(parseNode());
			}
			source = source.substr(currentPos);
			currentPos = 0;
		}
	} else if (options.parseNode) {
		out = parseNode();
	} else {
		out = parseChildren('');
	}

	if (options.filter && Array.isArray(out)) {
		out = filter(out, options.filter);
	}

	if (options.simplify && Array.isArray(out)) {
		return simplify(out);
	}

	if (options.setPos && out && typeof out === 'object' && !Array.isArray(out)) {
		(out as TNode & { pos: number }).pos = currentPos;
	}

	return Array.isArray(out) ? out : [out];
}

/**
 * Simplifies the parsed XML/HTML structure
 * @param children The list of child nodes
 * @returns A simplified object structure
 */
export function simplify(children: (TNode | string)[]): any {
	const out: Record<string, any> = {};
	if (!children.length) {
		return '';
	}

	if (children.length === 1 && typeof children[0] === 'string') {
		return children[0];
	}

	children.forEach((child) => {
		if (typeof child !== 'object') {
			return;
		}
		if (!out[child.tagName]) {
			out[child.tagName] = [];
		}
		const kids = simplify(child.children);
		out[child.tagName].push(kids);
		if (Object.keys(child.attributes).length && typeof kids !== 'string') {
			(kids as any)._attributes = child.attributes;
		}
	});

	for (const key in out) {
		if (out[key].length === 1) {
			out[key] = out[key][0];
		}
	}

	return out;
}

/**
 * Simplifies the parsed XML/HTML structure with less information loss
 * @param children The list of child nodes
 * @param parentAttributes The attributes of the parent node
 * @returns A simplified object structure
 */
export function simplifyLostLess(
	children: (TNode | string)[],
	parentAttributes: Record<string, string | null> = {}
): any {
	const out: Record<string, any> = {};
	if (!children.length) {
		return out;
	}

	if (children.length === 1 && typeof children[0] === 'string') {
		return Object.keys(parentAttributes).length
			? {
					_attributes: parentAttributes,
					value: children[0]
				}
			: children[0];
	}

	children.forEach((child) => {
		if (typeof child !== 'object') {
			return;
		}
		if (!out[child.tagName]) {
			out[child.tagName] = [];
		}
		const kids = simplifyLostLess(child.children || [], child.attributes);
		out[child.tagName].push(kids);
		if (Object.keys(child.attributes).length) {
			(kids as any)._attributes = child.attributes;
		}
	});

	return out;
}

/**
 * Filters the parsed XML/HTML structure
 * @param children The list of child nodes
 * @param f The filter function
 * @param depth The current depth in the tree
 * @param path The current path in the tree
 * @returns Filtered list of nodes
 */
export function filter(
	children: (TNode | string)[],
	f: (node: TNode, index: number, depth: number, path: string) => boolean,
	depth = 0,
	path = ''
): TNode[] {
	const out: TNode[] = [];
	children.forEach((child, i) => {
		if (typeof child === 'object' && f(child, i, depth, path)) {
			out.push(child);
		}
		if (typeof child === 'object' && child.children) {
			const kids = filter(
				child.children,
				f,
				depth + 1,
				(path ? path + '.' : '') + i + '.' + child.tagName
			);
			out.push(...kids);
		}
	});
	return out;
}

/**
 * Stringifies a parsed XML/HTML object back to a string
 * @param obj The object to stringify
 * @returns The stringified XML/HTML
 */
export function stringify(obj: TNode | (TNode | string)[]): string {
	let out = '';

	function writeChildren(children: (TNode | string)[]) {
		if (children) {
			children.forEach((child) => {
				if (typeof child === 'string') {
					out += child.trim();
				} else {
					writeNode(child);
				}
			});
		}
	}

	function writeNode(node: TNode) {
		out += `<${node.tagName}`;
		for (const [key, value] of Object.entries(node.attributes)) {
			if (value === null) {
				out += ` ${key}`;
			} else if (value.indexOf('"') === -1) {
				out += ` ${key}="${value.trim()}"`;
			} else {
				out += ` ${key}='${value.trim()}'`;
			}
		}
		if (node.tagName[0] === '?') {
			out += '?>';
			return;
		}
		out += '>';
		writeChildren(node.children);
		out += `</${node.tagName}>`;
	}

	if (Array.isArray(obj)) {
		writeChildren(obj);
	} else {
		writeNode(obj);
	}

	return out;
}

/**
 * Converts a parsed XML/HTML structure to a content string
 * @param tDom The parsed XML/HTML structure
 * @returns The content string
 */
export function toContentString(tDom: TNode | (TNode | string)[] | string): string {
	if (Array.isArray(tDom)) {
		return tDom.map(toContentString).join(' ').trim();
	} else if (typeof tDom === 'object') {
		return toContentString(tDom.children);
	} else {
		return ' ' + tDom;
	}
}
