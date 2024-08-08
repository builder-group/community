import { parseXmlStream, XmlStream, type TTokenCallback } from './tokenizer';

export function parseString(
	xmlString: string,
	allowDtd: boolean,
	tokenCallback: TTokenCallback
): void {
	parseXmlStream(new XmlStream(xmlString), allowDtd, tokenCallback);
}
