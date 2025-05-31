import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as camaro from 'camaro';
import { beforeAll, expect, it } from 'vitest';
import { htmlConfig } from '../config';
import { process, type TProcessor } from '../processor';
import { pathTracker } from '../processor/processors';
import { select } from '../selector';
import { tokenToXml } from '../token-to-xml';
import { xmlToSimplifiedObject } from '../xml-to-simplified-object';

describe('playground', () => {
	it('should pass', () => {
		expect(true).toBe(true);
	});

	describe('HTML should work', () => {
		let html = '';

		beforeAll(async () => {
			html = await readFile(`${__dirname}/resources/kleinanzeigen.html`, 'utf-8');
		});

		it('[xml-tokenizer] shoud work', async () => {
			const result = await xmlToSimplifiedObject(html, htmlConfig);

			console.log(result);
		});

		it('[process] should work', () => {
			// Article extractor that uses path tracking
			const articleExtractor: TProcessor<
				{
					articles: Array<{ id: string; title: string }>;
					currentArticle: { id?: string; title?: string } | null;
				},
				[typeof pathTracker]
			> = {
				name: 'ArticleExtractor',
				context: {
					articles: [],
					currentArticle: null
				},
				deps: [pathTracker],
				process: (token, context) => {
					const path = context.currentPath;

					// Start tracking a new article when we enter an article element
					if (token.type === 'ElementStart' && token.local === 'article') {
						context.currentArticle = {};
					}

					// Extract ID from data-adid attribute on article element
					if (
						token.type === 'Attribute' &&
						token.local === 'data-adid' &&
						path.endsWith('article') &&
						context.currentArticle
					) {
						context.currentArticle.id = token.value;
					}

					// Extract title from text in h2/a path within article
					if (
						token.type === 'Text' &&
						path.includes('article') &&
						path.includes('h2') &&
						path.includes('a') &&
						context.currentArticle
					) {
						const text = token.text.trim();
						if (text.length > 0) {
							context.currentArticle.title = text;
						}
					}

					// Finish article when we close the article element
					if (
						token.type === 'ElementEnd' &&
						token.end.type === 'Close' &&
						token.end.local === 'article' &&
						context.currentArticle &&
						context.currentArticle.id &&
						context.currentArticle.title
					) {
						context.articles.push({
							id: context.currentArticle.id,
							title: context.currentArticle.title
						});
						context.currentArticle = null;
					}
				}
			};

			const result = process(html, [pathTracker, articleExtractor], htmlConfig);

			console.log('Extracted articles:', result.articles);
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
