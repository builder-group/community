import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as camaro from 'camaro';
import { beforeAll, expect, it } from 'vitest';
import { htmlConfig } from '../config';
import { htmlToMarkdown } from '../html-to-md';
import { select } from '../selector';
import { tokenToXml } from '../token-to-xml';
import { xmlToSimplifiedObject } from '../xml-to-simplified-object';

describe('playground', () => {
	it('should pass', () => {
		expect(true).toBe(true);
	});

	describe.skip('HTML should work', () => {
		let html = '';

		beforeAll(async () => {
			html = await readFile(`${__dirname}/resources/sample.html`, 'utf-8');
		});

		it('[xml-tokenizer] shoud work', async () => {
			const result = await xmlToSimplifiedObject(html, htmlConfig);

			console.log(result);
		});

		it('[xml-tokenizer] should work with fetched html', async () => {
			const response = await fetch('https://www.reddit.com');
			const html = await response.text();

			const result = await xmlToSimplifiedObject(html, htmlConfig);

			console.log(result);
		});

		it('[xml-tokenizer] should transform html to markdown', () => {
			const markdown = htmlToMarkdown(html);

			console.log({ markdown });
		});
	});

	describe.skip('XML should work', () => {
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
					if (token.type !== 'SelectionStart' && token.type !== 'SelectionEnd') {
						xmlString += tokenToXml(token);
					}
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
});
