import { parseXml, type Token } from './wasm';
import { type TXMLNode } from './xml-to-object';

export function xmlToObjectWasm(xmlString: string): TXMLNode {
	const root: TXMLNode = {
		tagName: 'root',
		attributes: {},
		children: []
	};
	const stack: TXMLNode[] = [root];
	let currentNode: TXMLNode = root;

	parseXml(xmlString, false, (token: Token) => {
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
				currentNode.attributes[`${token.prefix}:${token.local}`] = token.value.text;
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
