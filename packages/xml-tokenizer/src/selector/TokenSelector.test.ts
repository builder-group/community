import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { tokenize, type TXmlToken } from '../tokenizer';
import { tokensToXml } from '../tokens-to-xml';
import { TokenSelector } from './TokenSelector';

describe('selector tests', () => {
	let bookStoreXml = '';

	beforeAll(async () => {
		bookStoreXml = await readFile(
			path.join(__dirname, '../__tests__/resources/bookstore.xml'),
			'utf-8'
		);
	});

	it('should work', () => {
		const selector = new TokenSelector([
			[
				{ axis: '/', local: 'bookstore' },
				{ axis: '/', local: 'book', attributes: [{ local: 'category', value: 'COOKING' }] }
			]
		]);
		const recorded: TXmlToken[] = [];

		tokenize(bookStoreXml, false, (token) => {
			selector.pipeToken(token, (recordedToken) => {
				recorded.push(recordedToken);
			});
		});

		console.log(tokensToXml(recorded));
		expect(recorded).not.toBeNull();
	});
});
