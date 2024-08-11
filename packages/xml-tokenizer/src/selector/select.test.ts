import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { type TXmlToken } from '../tokenizer';
import { tokensToXml } from '../tokens-to-xml';
import { select } from './select';
import { type TTokenSelectPath } from './types';

describe('select function', () => {
	let bookStoreXml = '';
	let inceptionXml = '';
	let namespaceXml = '';

	beforeAll(async () => {
		bookStoreXml = await readFile(
			path.join(__dirname, '../__tests__/resources/bookstore.xml'),
			'utf-8'
		);
		inceptionXml = await readFile(
			path.join(__dirname, '../__tests__/resources/inception.xml'),
			'utf-8'
		);
		namespaceXml = await readFile(
			path.join(__dirname, '../__tests__/resources/namespace.xml'),
			'utf-8'
		);
	});

	// TODO: Remove playground
	// it('should work', () => {
	// 	const selector = new TokenSelector([
	// 		[{ axis: 'self-or-descendant', local: 'title', textContains: 'Imposter' }]
	// 		// [
	// 		// 	{ axis: 'child', local: 'bookstore' },
	// 		// 	{ axis: 'child', local: 'book' },
	// 		// 	{ axis: 'child', local: 'title', textContains: 'Everyday Italian' }
	// 		// ]
	// 		// [
	// 		// 	{ axis: 'child', local: 'bookstore' },
	// 		// 	{ axis: 'child', local: 'book', attributes: [{ local: 'category', value: 'CHILDREN' }] }
	// 		// ],
	// 		// [
	// 		// 	{ axis: 'child', local: 'bookstore' },
	// 		// 	{ axis: 'child', local: 'book', attributes: [{ local: 'category', value: 'COOKING' }] }
	// 		// ]
	// 	]);
	// 	const recorded: TXmlToken[] = [];

	// 	tokenize(bookStoreXml, false, (token) => {
	// 		selector.pipeToken(token, (recordedToken) => {
	// 			recorded.push(recordedToken);
	// 		});
	// 	});

	// 	console.log(tokensToXml(recorded));
	// 	expect(recorded).not.toBeNull();
	// });

	it('should match /bookstore', () => {
		assertSelection(
			bookStoreXml,
			[[{ axis: 'child', local: 'bookstore' }]],
			`<bookstore>
        <book category="COOKING">
                <title lang="en">Everyday Italian</title>
                <author>Giada De Laurentiis</author>
                <year>2005</year>
                <price>30.00</price>
        </book>
        <book category="CHILDREN">
                <title lang="en">Harry Potter</title>
                <author>J K. Rowling</author>
                <year>2005</year>
                <price>29.99</price>
        </book>
        <book category="WEB">
                <title lang="en">XQuery Kick Start</title>
                <author>James McGovern</author>
                <author>Per Bothner</author>
                <author>Kurt Cagle</author>
                <author>James Linn</author>
                <author>Vaidyanathan Nagarajan</author>
                <year>2003</year>
                <price>49.99</price>
        </book>
        <book category="WEB">
                <title lang="en">Learning XML</title>
                <author>Erik T. Ray</author>
                <year>2003</year>
                <price>39.95</price>
        </book>
</bookstore>`
		);
	});

	it('should match /bookstore/book', () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{ axis: 'child', local: 'bookstore' },
					{ axis: 'child', local: 'book' }
				]
			],
			`<book category="COOKING">
                <title lang="en">Everyday Italian</title>
                <author>Giada De Laurentiis</author>
                <year>2005</year>
                <price>30.00</price>
        </book><book category="CHILDREN">
                <title lang="en">Harry Potter</title>
                <author>J K. Rowling</author>
                <year>2005</year>
                <price>29.99</price>
        </book><book category="WEB">
                <title lang="en">XQuery Kick Start</title>
                <author>James McGovern</author>
                <author>Per Bothner</author>
                <author>Kurt Cagle</author>
                <author>James Linn</author>
                <author>Vaidyanathan Nagarajan</author>
                <year>2003</year>
                <price>49.99</price>
        </book><book category="WEB">
                <title lang="en">Learning XML</title>
                <author>Erik T. Ray</author>
                <year>2003</year>
                <price>39.95</price>
        </book>`
		);
	});

	it('should match /bookstore/book[@category="COOKING"]', () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{ axis: 'child', local: 'bookstore' },
					{ axis: 'child', local: 'book', attributes: [{ local: 'category', value: 'COOKING' }] }
				]
			],
			`<book category="COOKING">
                <title lang="en">Everyday Italian</title>
                <author>Giada De Laurentiis</author>
                <year>2005</year>
                <price>30.00</price>
        </book>`
		);
	});

	it('should not match /bookstore/title', () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{ axis: 'child', local: 'bookstore' },
					{ axis: 'child', local: 'title' }
				]
			],
			''
		);
	});

	it("should match /bookstore/book/title[contains(text(),'Harry Potter')]", () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{ axis: 'child', local: 'bookstore' },
					{ axis: 'child', local: 'book' },
					{ axis: 'child', local: 'title', containsText: 'Harry Potter' }
				]
			],
			`<title lang="en">Harry Potter</title>`
		);
	});

	it('should match //book', () => {
		assertSelection(
			bookStoreXml,
			[[{ axis: 'self-or-descendant', local: 'book' }]],
			`<book category="COOKING">
                <title lang="en">Everyday Italian</title>
                <author>Giada De Laurentiis</author>
                <year>2005</year>
                <price>30.00</price>
        </book><book category="CHILDREN">
                <title lang="en">Harry Potter</title>
                <author>J K. Rowling</author>
                <year>2005</year>
                <price>29.99</price>
        </book><book category="WEB">
                <title lang="en">XQuery Kick Start</title>
                <author>James McGovern</author>
                <author>Per Bothner</author>
                <author>Kurt Cagle</author>
                <author>James Linn</author>
                <author>Vaidyanathan Nagarajan</author>
                <year>2003</year>
                <price>49.99</price>
        </book><book category="WEB">
                <title lang="en">Learning XML</title>
                <author>Erik T. Ray</author>
                <year>2003</year>
                <price>39.95</price>
        </book>`
		);
	});

	it('should match //book[@category="COOKING"]', () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{
						axis: 'self-or-descendant',
						local: 'book',
						attributes: [{ local: 'category', value: 'COOKING' }]
					}
				]
			],
			`<book category="COOKING">
                <title lang="en">Everyday Italian</title>
                <author>Giada De Laurentiis</author>
                <year>2005</year>
                <price>30.00</price>
        </book>`
		);
	});

	it('should match //book/title', () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{ axis: 'self-or-descendant', local: 'book' },
					{ axis: 'child', local: 'title' }
				]
			],
			`<title lang="en">Everyday Italian</title><title lang="en">Harry Potter</title><title lang="en">XQuery Kick Start</title><title lang="en">Learning XML</title>`
		);
	});

	it("should match //book/title[contains(text(),'Harry Potter')]", () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{ axis: 'self-or-descendant', local: 'book' },
					{ axis: 'child', local: 'title', containsText: 'Harry Potter' }
				]
			],
			`<title lang="en">Harry Potter</title>`
		);
	});

	it("should match //*[contains(text(),'Harry Potter')]", () => {
		assertSelection(
			bookStoreXml,
			[[{ axis: 'self-or-descendant', local: '*', containsText: 'Harry Potter' }]],
			`<title lang="en">Harry Potter</title>`
		);
	});

	it('should match //book//title', () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{ axis: 'self-or-descendant', local: 'book' },
					{ axis: 'self-or-descendant', local: 'title' }
				]
			],
			`<title lang="en">Everyday Italian</title><title lang="en">Harry Potter</title><title lang="en">XQuery Kick Start</title><title lang="en">Learning XML</title>`
		);
	});

	it('should match /bookstore/*/title', () => {
		assertSelection(
			bookStoreXml,
			[
				[
					{ axis: 'child', local: 'bookstore' },
					{ axis: 'child', local: '*' },
					{ axis: 'child', local: 'title' }
				]
			],
			`<title lang="en">Everyday Italian</title><title lang="en">Harry Potter</title><title lang="en">XQuery Kick Start</title><title lang="en">Learning XML</title>`
		);
	});

	it('should match //node', () => {
		assertSelection(
			inceptionXml,
			[[{ axis: 'self-or-descendant', local: 'node' }]],
			`<node>
		<node>
            <node />
        </node>
	</node>`
		);
	});

	it('should match //test:node', () => {
		assertSelection(
			namespaceXml,
			[[{ axis: 'self-or-descendant', local: 'node', prefix: 'test' }]],
			`<test:node>
        </test:node>`
		);
	});

	it('should match //test:*', () => {
		assertSelection(
			namespaceXml,
			[[{ axis: 'self-or-descendant', local: '*', prefix: 'test' }]],
			`<test:node>
        </test:node>`
		);
	});
});

function collectRecordedTokens(text: string, tokenSelectPaths: TTokenSelectPath[]): TXmlToken[] {
	const recordedTokens: TXmlToken[] = [];
	select(text, tokenSelectPaths, (recordedToken) => {
		recordedTokens.push(recordedToken);
	});
	return recordedTokens;
}

// Results where validated via xpather.com
function assertSelection(text: string, tokenSelectPaths: TTokenSelectPath[], result: string): void {
	// console.log(tokensToXml(collectRecordedTokens(text, tokenSelectPaths)));
	expect(tokensToXml(collectRecordedTokens(text, tokenSelectPaths)).replaceAll(/\s/g, '')).toBe(
		result.replaceAll(/\s/g, '')
	);
}
