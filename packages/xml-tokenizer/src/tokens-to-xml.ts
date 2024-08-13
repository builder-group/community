import { tokenToXml } from './token-to-xml';
import { type TXmlToken } from './tokenizer';

export function tokensToXml(tokens: TXmlToken[]): string {
	let xmlString = '';

	tokens.forEach((token) => {
		xmlString += tokenToXml(token);
	});

	return xmlString;
}
