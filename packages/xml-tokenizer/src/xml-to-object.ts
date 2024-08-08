import { parseXmlStream, XmlStream } from './tokenizer';

export function xmlToObject(xmlString: string, allowDtd = false): TXMLNode {
	const root: TXMLNode = {
		tagName: 'root',
		attributes: {},
		children: []
	};
	const stack: TXMLNode[] = [root];
	let currentNode: TXMLNode = root;

	parseXmlStream(new XmlStream(xmlString), allowDtd, (token) => {
		switch (token.type) {
			case 'ElementStart': {
				const newNode: TXMLNode = {
					tagName: getTagName(token.local, token.prefix),
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
				currentNode.attributes[getTagName(token.local, token.prefix)] = token.value;
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
	});
	return root.children[0] as unknown as TXMLNode;
}

export interface TXMLNode {
	tagName: string;
	attributes: Record<string, string>;
	children: (TXMLNode | string)[];
}

export function getTagName(local: string, prefix: string): string {
	return prefix.length > 0 ? `${prefix}:${local}` : local;
}
