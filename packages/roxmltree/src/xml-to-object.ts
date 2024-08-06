import {
	parseString,
	type TAttributeToken,
	type TCdataToken,
	type TElementEndToken,
	type TElementStartToken,
	type TTextToken,
	type TXmlEvents,
	type TXMLToken
} from './tokenizer';

interface XMLNode {
	tagName: string;
	attributes: Record<string, string>;
	children: (XMLNode | string)[];
}

export function xmlToObject(xmlString: string): XMLNode {
	const root: XMLNode = {
		tagName: 'root',
		attributes: {},
		children: []
	};
	const stack: XMLNode[] = [root];
	let currentNode: XMLNode = root;

	const xmlEvents: TXmlEvents = {
		token: (token: TXMLToken) => {
			switch (token.type) {
				case 'ElementStart':
					handleElementStart(token);
					break;
				case 'ElementEnd':
					handleElementEnd(token);
					break;
				case 'Attribute':
					handleAttribute(token);
					break;
				case 'Text':
				case 'Cdata':
					handleTextOrCdata(token);
					break;
				case 'Comment':
				case 'ProcessingInstruction':
				case 'EntityDeclaration':
					break;
			}
		}
	};

	function handleElementStart(token: TElementStartToken): void {
		const newNode: XMLNode = {
			tagName: getFullName(token.prefix, token.local),
			attributes: {},
			children: []
		};
		currentNode.children.push(newNode);
		stack.push(newNode);
		currentNode = newNode;
	}

	function handleElementEnd(token: TElementEndToken): void {
		if (token.end.type === 'Close' || token.end.type === 'Empty') {
			stack.pop();
			const newCurrentNode = stack[stack.length - 1];
			if (newCurrentNode != null) {
				currentNode = newCurrentNode;
			}
		}
	}

	function handleAttribute(token: TAttributeToken): void {
		const attrName = getFullName(token.prefix, token.local);
		currentNode.attributes[attrName] = token.value.toString();
	}

	function handleTextOrCdata(token: TTextToken | TCdataToken): void {
		const trimmedText = token.text.trim();
		if (trimmedText.length > 0) {
			currentNode.children.push(token.text);
		}
	}

	parseString(xmlString, false, xmlEvents);
	return root.children[0] as unknown as XMLNode;
}

function getFullName(prefix: string, local: string): string {
	return prefix ? `${prefix}:${local}` : local;
}
