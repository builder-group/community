import * as fxp from 'fast-xml-parser';
import * as txml from 'txml';
import {
	processTokenForSimplifiedObject,
	select,
	tokensToXml,
	TXmlToken,
	xmlToObject,
	xmlToSimplifiedObject
} from 'xml-tokenizer';
import * as xml2js from 'xml2js';

import { bench } from './bench';
import { parse } from './txml';

// playground();
shopifyTest();
// benchmarkTest();

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

	const result = {};
	const stack = [result];
	let tokens: TXmlToken[] = [];
	select(
		shopifyHtml,
		[
			[
				{
					axis: 'self-or-descendant',
					local: 'div',
					attributes: [
						{ local: 'data-controller', value: 'app-card' },
						{ local: 'data-app-card-handle-value', value: 'loox' }
					]
				}
			]
		],
		(token) => {
			tokens.push(token);
			processTokenForSimplifiedObject(token, stack);
		}
	);

	console.log({
		result,
		shopifyHtml,
		selectedHtml: tokensToXml(tokens)
	});
}

async function benchmarkTest(): Promise<void> {
	const xmlResult = await fetch('http://localhost:5173/300kb.xml');
	const xml = await xmlResult.text();

	console.log({ xml });

	const fastXmlParser = new fxp.XMLParser();

	const runs = 100;

	console.log('Xml to object');
	await bench(
		'xml-tokenizer',
		async () => {
			xmlToObject(xml);
		},
		runs
	);
	await bench(
		'txml-ts',
		async () => {
			parse(xml);
		},
		runs
	);
	await bench(
		'txml',
		async () => {
			txml.parse(xml);
		},
		runs
	);
	await bench(
		'fast-xml-parser',
		async () => {
			fastXmlParser.parse(xml);
		},
		runs
	);
	await bench(
		'xml2js',
		async () => {
			xml2js.parseString(xml, () => {});
		},
		runs
	);

	console.log('Select Xml node');
	await bench(
		'xml-tokenizer',
		async () => {
			// let selection = '';
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
					// selection += tokenToXml(token);
					if (token.type === 'Text') {
						cacheKey = token.text;
					}
				}
			);
			// console.log(cacheKey);
		},
		runs
	);
	await bench(
		'xml-tokenizer (dom)',
		async () => {
			const dom = xmlToSimplifiedObject(xml);
			const cacheKey = dom['HotelListResponse']['cacheKey']._text;
			// console.log(cacheKey);
		},
		runs
	);
	await bench(
		'txml',
		async () => {
			const dom = txml.parse(xml);
			const d = txml.simplifyLostLess(dom[0].children);
			const cacheKey = d.cacheKey[0];
			// console.log(cacheKey);
		},
		runs
	);
	// TODO: Can't make it work in browser env: ReferenceError: process is not defined
	// await bench('camaro', async () => {
	// 	const result = await camaro.transform(xml, { raw: 'raw(/HotelListResponse/cacheKey)' });
	// 	console.log({ result });
	// });
}
