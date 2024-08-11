import { type TXmlToken } from './tokenizer';

export function tokenToXml(token: TXmlToken): string {
	let xmlString = '';

	switch (token.type) {
		case 'ProcessingInstruction':
			xmlString += `<?${token.target}`;
			if (token.content) {
				xmlString += ` ${token.content}`;
			}
			xmlString += '?>';
			break;

		case 'Comment':
			xmlString += `<!--${token.text}-->`;
			break;

		case 'EntityDeclaration':
			xmlString += `<!ENTITY ${token.name} "${token.definition}">`;
			break;

		case 'ElementStart':
			xmlString += `<${token.prefix.length > 0 ? `${token.prefix}:` : ''}${token.local}`;
			break;

		case 'Attribute':
			xmlString += ` ${token.prefix.length > 0 ? `${token.prefix}:` : ''}${token.local}="${token.value}"`;
			break;

		case 'ElementEnd':
			if (token.end.type === 'Open') {
				xmlString += '>';
			} else if (token.end.type === 'Close') {
				xmlString += `</${token.end.prefix.length > 0 ? `${token.end.prefix}:` : ''}${token.end.local}>`;
			} else {
				xmlString += '/>';
			}
			break;

		case 'Text':
			xmlString += token.text;
			break;

		case 'Cdata':
			xmlString += `<![CDATA[${token.text}]]>`;
			break;
	}

	return xmlString;
}

export function tokensToXml(tokens: TXmlToken[]): string {
	let xmlString = '';

	tokens.forEach((token) => {
		xmlString += tokenToXml(token);
	});

	return xmlString;
}
