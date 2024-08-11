import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as camaro from 'camaro';
import { beforeAll, expect, it } from 'vitest';

import { select } from '../selector';
import { tokenToXml } from '../tokens-to-xml';

void describe('count nodes', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/bookstore.xml`, 'utf-8');
	});

	it('[camaro] shoud work', async () => {
		const result = await camaro.transform(xml, {
			raw: 'raw(/bookstore/book[@category="COOKING"])'
		});

		expect(result.raw.replaceAll(/\s/g, '')).toBe(
			`<book category="COOKING">
			<title lang="en">Everyday Italian</title>
			<author>Giada De Laurentiis</author>
			<year>2005</year>
			<price>30.00</price>
	</book>`.replaceAll(/\s/g, '')
		);
	});

	it('[xml-tokenizer] should work', () => {
		let xmlString = '';
		select(
			xml,
			[
				[
					{ axis: 'child', local: 'bookstore' },
					{ axis: 'child', local: 'book', attributes: [{ local: 'category', value: 'COOKING' }] }
				]
			],
			(token) => {
				xmlString += tokenToXml(token);
			}
		);

		expect(xmlString.replaceAll(/\s/g, '')).toBe(
			`<book category="COOKING">
			<title lang="en">Everyday Italian</title>
			<author>Giada De Laurentiis</author>
			<year>2005</year>
			<price>30.00</price>
	</book>`.replaceAll(/\s/g, '')
		);
	});
});
