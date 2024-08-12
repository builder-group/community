import { tokenize } from './tokenizer';

export function xmlToObject(xmlString: string, allowDtd = false): TXmlNode {
	const root: TXmlNode = {
		local: 'root',
		attributes: [],
		content: []
	};
	const stack: TXmlNode[] = [root];

	tokenize(xmlString, allowDtd, (token) => {
		switch (token.type) {
			case 'ElementStart': {
				const newNode: TXmlNode = {
					local: token.local,
					prefix: token.prefix.length > 0 ? token.prefix : undefined,
					attributes: [],
					content: []
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
					stack.pop();
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
	});

	return root.content[0] as TXmlNode;
}

export interface TXmlNode {
	local: string;
	prefix?: string;
	attributes: { local: string; prefix?: string; value: string }[];
	content: (TXmlNode | string)[];
}
