import { getQName } from './get-q-name';
import { tokenize, type TXmlToken } from './tokenizer';

export function xmlToSimplifiedObject(xmlString: string, allowDtd = false): TSimplifiedXmlNode {
	const result: TSimplifiedXmlNode = {};
	const stack: TSimplifiedXmlNode[] = [result];

	tokenize(xmlString, allowDtd, (token) => {
		processTokenForSimplifiedObject(token, stack);
	});

	return result;
}

export function processTokenForSimplifiedObject(
	token: TXmlToken,
	stack: TSimplifiedXmlNode[]
): void {
	switch (token.type) {
		case 'ElementStart': {
			const tagName = getQName(token.local, token.prefix);
			const tagNameWithPrefix: TSimplifiedXmlNodeTagName = `_${tagName}`;
			const newNode: TSimplifiedXmlNode = {};

			const currentNode = stack[stack.length - 1];
			if (currentNode != null) {
				if (currentNode.content != null) {
					newNode.tag = tagName;
					currentNode.content.push(newNode);
				} else if (currentNode.text != null) {
					newNode.tag = tagName;
					currentNode.content = [currentNode.text, newNode];
					delete currentNode.text;
				} else if (currentNode[tagNameWithPrefix] == null) {
					currentNode[tagNameWithPrefix] = newNode;
				} else if (Array.isArray(currentNode[tagNameWithPrefix])) {
					currentNode[tagNameWithPrefix].push(newNode);
				} else {
					currentNode[tagNameWithPrefix] = [currentNode[tagNameWithPrefix], newNode];
				}
			}

			stack.push(newNode);
			break;
		}
		case 'ElementEnd': {
			if (token.end.type === 'Close' || token.end.type === 'Empty') {
				stack.pop();
			}
			break;
		}
		case 'Attribute': {
			const currentNode = stack[stack.length - 1];
			if (currentNode != null) {
				const attrName = getQName(token.local, token.prefix);
				if (currentNode.attributes != null) {
					currentNode.attributes[attrName] = token.value;
				} else {
					currentNode.attributes = {
						[attrName]: token.value
					};
				}
			}
			break;
		}
		case 'Text':
		case 'Cdata': {
			const currentNode = stack[stack.length - 1];
			if (currentNode != null) {
				const trimmedText = token.text.trim();
				if (trimmedText.length > 0) {
					if (currentNode.content != null) {
						currentNode.content.push(trimmedText);
					} else if (currentNode.text != null) {
						currentNode.content = [currentNode.text, trimmedText];
						delete currentNode.text;
					} else {
						currentNode.text = trimmedText;
					}
				}
			}
			break;
		}
		case 'Comment':
		case 'ProcessingInstruction':
		case 'EntityDeclaration':
	}
}

export interface TSimplifiedXmlNode {
	tag?: string;
	attributes?: Record<string, string>;
	text?: string;
	content?: (string | TSimplifiedXmlNode)[];
	// TODO: Do we need a prefix to make it typesafe?
	[key: TSimplifiedXmlNodeTagName]: TSimplifiedXmlNode | TSimplifiedXmlNode[];
}

type TSimplifiedXmlNodeTagName = `_${string}`;
