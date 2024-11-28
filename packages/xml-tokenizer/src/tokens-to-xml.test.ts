import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { tokenize, type TXmlToken } from './tokenizer';
import { tokensToXml } from './tokens-to-xml';

describe('tokensToXml function', () => {
	let bookStoreXml = '';

	beforeAll(async () => {
		bookStoreXml = await readFile(
			path.join(__dirname, './__tests__/resources/bookstore.xml'),
			'utf-8'
		);
	});

	it('should work', () => {
		const tokens: TXmlToken[] = [];
		tokenize(bookStoreXml, (token) => tokens.push(token));

		const result = tokensToXml(tokens);

		expect(result).toBe(bookStoreXml);
	});
});
