import { parseXmlStream, TextXmlStream, type TTokenCallback } from './tokenizer';

export function parseString(
	xmlString: string,
	allowDtd: boolean,
	tokenCallback: TTokenCallback
): void {
	parseXmlStream(new TextXmlStream(xmlString), allowDtd, tokenCallback);
}
