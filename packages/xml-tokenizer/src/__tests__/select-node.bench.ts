import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as camaro from 'camaro';
import { beforeAll, bench, expect } from 'vitest';

// import * as xt from 'xml-tokenizer';

import { select, tokenToXml } from '../index';

void describe('count nodes', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
	});

	bench('[xml-tokenizer]', () => {
		let result = '';
		select(
			xml,
			[
				[
					{ axis: 'child', local: 'bookstore' },
					{ axis: 'child', local: 'book', attributes: [{ local: 'category', value: 'COOKING' }] }
				]
			],
			(token) => {
				result += tokenToXml(token);
			}
		);

		expect(result).not.toBeNull();
		// 	expect(result.replaceAll(/\s/g, '')).toBe(
		// 		`<book category="COOKING">
		// 		<title lang="en">Everyday Italian</title>
		// 		<author>Giada De Laurentiis</author>
		// 		<year>2005</year>
		// 		<price>30.00</price>
		// </book>`.replaceAll(/\s/g, '')
		// 	);
	});

	// bench('[xml-tokenizer (npm)]', () => {
	// 	let nodeCount = 0;
	// 	xt.parseXmlStream(new xt.XmlStream(xml), false, (token) => {
	// 		if (token.type === 'ElementStart') {
	// 			nodeCount++;
	// 		}
	// 	});

	// 	expect(nodeCount).toBe(10045);
	// });

	bench('[camaro]', async () => {
		const result = await camaro.transform(xml, {
			raw: 'raw(/bookstore/book[@category="COOKING"])'
		});

		expect(result).not.toBeNull();
		// 	expect(result.raw.replaceAll(/\s/g, '')).toBe(
		// 		`<book category="COOKING">
		// 		<title lang="en">Everyday Italian</title>
		// 		<author>Giada De Laurentiis</author>
		// 		<year>2005</year>
		// 		<price>30.00</price>
		// </book>`.replaceAll(/\s/g, '')
		// 	);
	});
});
