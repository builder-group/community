import * as fxp from 'fast-xml-parser';
import * as txml from 'txml';
import {
	processTokenForSimplifiedObject,
	select,
	tokensToXml,
	TSelectedXmlToken,
	TSimplifiedXmlNode,
	TXmlToken,
	xmlToObject,
	xmlToSimplifiedObject
} from 'xml-tokenizer';
import * as xml2js from 'xml2js';

import { bench } from './bench';
import { parse } from './txml';

// playground();
// shopifyTest();
benchmarkTest();

async function playground(): Promise<void> {
	const dom = txml.parse('<root test="2"><child attr="1">One</child><child>Two</child></root>');
	const simplified = txml.simplify(dom);
	const simplifiedLostLess = txml.simplifyLostLess(dom);
	console.log({ simplified, simplifiedLostLess });
}

async function shopifyTest(): Promise<void> {
	const shopifyResult = await fetch(
		'https://cors-anywhere.herokuapp.com/https://apps.shopify.com/search?page=1&q=review',
		{
			headers: {
				'Accept': 'text/html, application/xhtml+xml',
				'Turbo-Frame': 'search_page'
			}
		}
	);
	const shopifyHtml = await shopifyResult.text();

	const results: any[] = [];
	let stack: any[] = [];
	let tokens: TSelectedXmlToken[] = [];
	select(
		shopifyHtml,
		[
			[
				{
					axis: 'self-or-descendant',
					local: 'div',
					attributes: [
						{ local: 'data-controller', value: 'app-card' }
						// { local: 'data-app-card-handle-value', value: 'loox' }
					]
				}
			]
		],
		(token) => {
			tokens.push(token);

			if (token.type === 'SelectionStart') {
				const result: any = {};
				results.push(result);
				stack = [result];
				return;
			}

			if (token.type === 'SelectionEnd') {
				return;
			}

			processTokenForSimplifiedObject(token as TXmlToken, stack);
		}
	);

	console.log({
		results,
		shopifyHtml,
		selectedHtml: tokensToXml(tokens as TXmlToken[])
	});
	console.log(results.map((result: any) => result._div.attributes['data-app-card-handle-value']));
}

async function benchmarkTest(): Promise<void> {
	const xmlResult = await fetch('http://localhost:5173/300kb.xml');
	const xml = await xmlResult.text();

	await bench1(xml, 100);
	await bench2(xml, 100);
}

async function bench1(xml: string, runs = 100) {
	const fastXmlParser = new fxp.XMLParser();

	const benchmarkResults = [
		await bench(
			'xml-tokenizer',
			async () => {
				xmlToObject(xml);
			},
			runs
		),
		await bench(
			'xml-tokenizer (simplified)',
			async () => {
				xmlToSimplifiedObject(xml);
			},
			runs
		),
		await bench(
			'txml-ts',
			async () => {
				parse(xml);
			},
			runs
		),
		await bench(
			'txml',
			async () => {
				txml.parse(xml);
			},
			runs
		),
		await bench(
			'txml (simplified)',
			async () => {
				txml.simplifyLostLess(txml.parse(xml)[0].children);
			},
			runs
		),
		await bench(
			'fast-xml-parser',
			async () => {
				fastXmlParser.parse(xml);
			},
			runs
		),
		await bench(
			'xml2js',
			async () => {
				xml2js.parseString(xml, () => {});
			},
			runs
		)
	];

	console.log('Xml to object');
	console.table(
		benchmarkResults.sort(
			(a, b) => Number(b.success) - Number(a.success) || a.averageTimeMs - b.averageTimeMs
		)
	);
}

async function bench2(xml: string, runs = 100) {
	const benchmarkResults = [
		await bench(
			'xml-tokenizer',
			async () => {
				let cacheKey = '';
				select(
					xml,
					[
						[
							{ axis: 'child', local: 'HotelListResponse' },
							{ axis: 'child', local: 'cacheKey' }
						]
					],
					(token) => {
						if (token.type === 'Text') {
							cacheKey = token.text;
						}
					}
				);
				// console.log(cacheKey);
			},
			runs
		),
		await bench(
			'xml-tokenizer (dom)',
			async () => {
				const dom = xmlToSimplifiedObject(xml);
				const cacheKey = (
					(dom['_HotelListResponse'] as TSimplifiedXmlNode)['_cacheKey'] as TSimplifiedXmlNode
				).text;
				// console.log(cacheKey);
			},
			runs
		),
		await bench(
			'txml',
			async () => {
				const dom = txml.parse(xml);
				const d = txml.simplifyLostLess(dom[0].children);
				const cacheKey = d.cacheKey[0];
				// console.log(cacheKey);
			},
			runs
		)
		// TODO: Can't make it work in browser env: ReferenceError: process is not defined
		// await bench('camaro', async () => {
		// 	const result = await camaro.transform(xml, { raw: 'raw(/HotelListResponse/cacheKey)' });
		// 	console.log({ result });
		// })
	];

	console.log('Select Xml node');
	console.table(
		benchmarkResults.sort(
			(a, b) => Number(b.success) - Number(a.success) || a.averageTimeMs - b.averageTimeMs
		)
	);
}
