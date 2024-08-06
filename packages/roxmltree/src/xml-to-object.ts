import { parseString, type TXmlEvents, type TXMLToken } from './tokenizer';

export function xmlToObject(xmlString: string): TXMLNode {
	const root: TXMLNode = {
		tagName: 'root',
		attributes: {},
		children: []
	};
	const stack: TXMLNode[] = [root];
	let currentNode: TXMLNode = root;

	const xmlEvents: TXmlEvents = {
		token: (token: TXMLToken) => {
			switch (token.type) {
				case 'ElementStart': {
					const newNode: TXMLNode = {
						tagName: `${token.prefix}:${token.local}`,
						attributes: {},
						children: []
					};
					currentNode.children.push(newNode);
					stack.push(newNode);
					currentNode = newNode;
					break;
				}
				case 'ElementEnd': {
					if (token.end.type === 'Close' || token.end.type === 'Empty') {
						stack.pop();
						const newCurrentNode = stack[stack.length - 1];
						if (newCurrentNode != null) {
							currentNode = newCurrentNode;
						}
					}
					break;
				}
				case 'Attribute': {
					currentNode.attributes[`${token.prefix}:${token.local}`] = token.value.toString();
					break;
				}
				case 'Text':
				case 'Cdata': {
					const trimmedText = token.text.trim();
					if (trimmedText.length > 0) {
						currentNode.children.push(token.text);
					}
					break;
				}
				case 'Comment':
				case 'ProcessingInstruction':
				case 'EntityDeclaration':
					break;
			}
		}
	};

	parseString(xmlString, false, xmlEvents);
	return root.children[0] as unknown as TXMLNode;
}

export interface TXMLNode {
	tagName: string;
	attributes: Record<string, string>;
	children: (TXMLNode | string)[];
}
