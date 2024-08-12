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
			const newNode: TSimplifiedXmlNode = {};

			const currentNode = stack[stack.length - 1];
			if (currentNode != null) {
				if (currentNode._content != null) {
					newNode._tag = tagName;
					currentNode._content.push(newNode);
				} else if (currentNode._text != null) {
					newNode._tag = tagName;
					currentNode._content = [currentNode._text, newNode];
					delete currentNode._text;
				} else if (currentNode[tagName] == null) {
					currentNode[tagName] = newNode;
				} else if (Array.isArray(currentNode[tagName])) {
					(currentNode[tagName] as TSimplifiedXmlNode[]).push(newNode);
				} else {
					currentNode[tagName] = [currentNode[tagName] as TSimplifiedXmlNode, newNode];
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
				if (currentNode._attributes != null) {
					currentNode._attributes[attrName] = token.value;
				} else {
					currentNode._attributes = {
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
					if (currentNode._content != null) {
						currentNode._content.push(trimmedText);
					} else if (currentNode._text != null) {
						currentNode._content = [currentNode._text, trimmedText];
						delete currentNode._text;
					} else {
						currentNode._text = trimmedText;
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
	_tag?: string;
	_attributes?: Record<string, string>;
	_text?: string;
	_content?: (string | TSimplifiedXmlNode)[];
	[key: string]:
		| TSimplifiedXmlNode
		| TSimplifiedXmlNode[]
		| string
		| (string | TSimplifiedXmlNode)[]
		| Record<string, string>
		| undefined;
}
