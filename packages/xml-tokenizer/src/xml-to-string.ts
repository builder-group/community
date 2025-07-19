import { getQName } from './get-q-name';
import { tokenize, type TXmlStreamOptions, type TXmlToken } from './tokenizer';

export function xmlToString(xmlString: string, options: TXmlToStringOptions = {}): string {
	const { transformers = {}, xmlOptions = {} } = options;

	const root: TXmlStringNode = {
		local: 'root',
		attributes: [],
		content: [],
		string: ''
	};
	const stack: TXmlStringNode[] = [root];

	tokenize(
		xmlString,
		(token) => {
			processTokenForString(token, stack, transformers);
		},
		xmlOptions
	);

	return root.string;
}

function processTokenForString(
	token: TXmlToken,
	stack: TXmlStringNode[],
	transformers: TXmlStringTransformers
): void {
	switch (token.type) {
		case 'ElementStart': {
			const newNode: TXmlStringNode = {
				local: token.local,
				prefix: token.prefix.length > 0 ? token.prefix : undefined,
				attributes: [],
				content: [],
				string: ''
			};

			const currentNode = stack[stack.length - 1];
			if (currentNode != null) {
				currentNode.content.push(newNode);
			}

			stack.push(newNode);
			break;
		}
		case 'ElementEnd': {
			if (token.end.type === 'Close' || token.end.type === 'Empty') {
				const currentNode = stack.pop();
				if (currentNode == null) {
					return;
				}

				const qName = getQName(currentNode.local, currentNode.prefix).toLowerCase();

				const transformer = transformers[qName];
				if (transformer != null) {
					currentNode.string = transformer(currentNode, stack);
				}

				const parentNode = stack[stack.length - 1];
				if (parentNode != null) {
					parentNode.string += currentNode.string;
				}
			}
			break;
		}
		case 'Attribute': {
			const currentNode = stack[stack.length - 1];
			if (currentNode != null) {
				currentNode.attributes.push({
					local: token.local,
					prefix: token.prefix.length > 0 ? token.prefix : undefined,
					value: token.value
				});
			}
			break;
		}
		case 'Text':
		case 'Cdata': {
			const currentNode = stack[stack.length - 1];
			if (currentNode != null) {
				const trimmedText = token.text.trim();
				if (trimmedText.length > 0) {
					currentNode.content.push(token.text);
				}
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
};

export type TXmlStringTransformer = (node: TXmlStringNode, stack: TXmlStringNode[]) => string;

export type TXmlStringTransformers = Record<string, TXmlStringTransformer>;

export interface TXmlStringNode {
	local: string;
	prefix?: string;
	attributes: { local: string; prefix?: string; value: string }[];
	content: (TXmlStringNode | string)[];
	string: string;
}

export function getXmlStringNodeContent(node: TXmlStringNode): string {
	return node.content.map((child) => (typeof child === 'string' ? child : child.string)).join('');
}
