import { getQName } from './get-q-name';
import { tokenize, type TXmlStreamOptions, type TXmlToken } from './tokenizer';

export function xmlToString(
	xmlString: string,
	options: TXmlToStringOptions = {}
): TXmlStringNode & { string: string } {
	const { transformers = {}, xmlOptions = {}, skipNodes = [], preserveTree = false } = options;

	const root: TXmlStringNode = {
		local: 'root',
		attributes: [],
		content: []
	};

	const cx: TXmlToStringContext = {
		stack: [root],
		transformers: {
			__default: getXmlStringNodeContent,
			...transformers
		},
		skipNodes: new Set(skipNodes),
		preserveTree
	};

	tokenize(
		xmlString,
		(token) => {
			processTokenForString(token, cx);
		},
		xmlOptions
	);

	root.string = getXmlStringNodeContent(root);
	return root as TXmlStringNode & { string: string };
}

function processTokenForString(token: TXmlToken, cx: TXmlToStringContext): void {
	switch (token.type) {
		case 'ElementStart': {
			const qName = getQName(
				token.local,
				token.prefix.length > 0 ? token.prefix : undefined
			).toLowerCase();
			const shouldSkip = cx.skipNodes.has(qName);

			const newNode: TXmlStringNode = {
				local: token.local,
				prefix: token.prefix.length > 0 ? token.prefix : undefined,
				attributes: [],
				content: [],
				skip: shouldSkip
			};

			const currentNode = cx.stack[cx.stack.length - 1];
			if (currentNode != null && !currentNode.skip) {
				currentNode.content.push(newNode);
			}

			cx.stack.push(newNode);
			break;
		}
		case 'ElementEnd': {
			if (token.end.type === 'Close' || token.end.type === 'Empty') {
				const currentNode = cx.stack.pop();
				if (currentNode == null || currentNode.skip) {
					return;
				}

				const qName = getQName(currentNode.local, currentNode.prefix).toLowerCase();

				// Transform node to string
				const transformer = cx.transformers[qName];
				if (transformer != null) {
					currentNode.string = transformer(currentNode, cx.stack);
				} else if (cx.transformers.__default != null) {
					currentNode.string = cx.transformers.__default(currentNode, cx.stack);
				}

				// Clear content if not preserving tree
				if (!cx.preserveTree) {
					currentNode.content = [];
				}
			}
			break;
		}
		case 'Attribute': {
			const currentNode = cx.stack[cx.stack.length - 1];
			if (currentNode == null || currentNode.skip) {
				return;
			}

			currentNode.attributes.push({
				local: token.local,
				prefix: token.prefix.length > 0 ? token.prefix : undefined,
				value: token.value
			});
			break;
		}
		case 'Text':
		case 'Cdata': {
			const currentNode = cx.stack[cx.stack.length - 1];
			if (currentNode == null || currentNode.skip) {
				return;
			}

			const trimmedText = token.text.trim();
			if (trimmedText.length > 0) {
				currentNode.content.push(token.text);
			}
			break;
		}
		case 'Comment':
		case 'ProcessingInstruction':
		case 'EntityDeclaration':
	}
}

export type TXmlToStringOptions = {
	transformers?: TXmlStringTransformers;
	xmlOptions?: TXmlStreamOptions;
	skipNodes?: string[];
	preserveTree?: boolean;
};

export type TXmlStringTransformer = (node: TXmlStringNode, stack: TXmlStringNode[]) => string;

export type TXmlStringTransformers = Record<string, TXmlStringTransformer>;

export interface TXmlStringNode {
	local: string;
	prefix?: string;
	attributes: { local: string; prefix?: string; value: string }[];
	content: (TXmlStringNode | string)[];
	skip?: boolean;
	string?: string;
}

interface TXmlToStringContext {
	stack: TXmlStringNode[];
	transformers: TXmlStringTransformers & { __default?: TXmlStringTransformer };
	skipNodes: Set<string>;
	preserveTree: boolean;
}

export function getXmlStringNodeContent(node: TXmlStringNode): string {
	return node.content.map((child) => (typeof child === 'string' ? child : child.string)).join('');
}
