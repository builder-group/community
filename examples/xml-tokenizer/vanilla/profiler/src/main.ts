import * as fxp from 'fast-xml-parser';
import { Bench } from 'tinybench';
import * as txml from 'txml';
import {
	processTokenForSimplifiedObject,
	select,
	tokensToXml,
	TSelectedXmlToken,
	TXmlToken,
	xmlToObject,
	xmlToSimplifiedObject
} from 'xml-tokenizer';

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

async function bench1(xml: string, time = 100) {
	const bench = new Bench({ time });

	const fastXmlParser = new fxp.XMLParser();

	bench
		.add('xml-tokenizer', () => {
			xmlToObject(xml);
		})
		.add('xml-tokenizer (simplified)', () => {
			xmlToSimplifiedObject(xml);
		})
		.add('txml-ts', () => {
			parse(xml);
		})
		.add('txml', () => {
			txml.parse(xml);
		})
		.add('txml (simplified)', () => {
			txml.simplifyLostLess(txml.parse(xml)[0].children);
		})
		.add('fast-xml-parser', () => {
			fastXmlParser.parse(xml);
		});
	// TODO: Doesn't work
	// .add('xml2js', () => {
	// 	xml2js.parseString(xml, () => {});
	// });

	await bench.warmup();
	await bench.run();

	console.log('Xml to object');
	console.table(
		bench
			.table()
			.sort(
				(a, b) =>
					parseInt(b?.['ops/sec'].toString() ?? '0') - parseInt(a?.['ops/sec'].toString() ?? '0')
			)
	);
}

async function bench2(xml: string, time = 100) {
	const bench = new Bench({ time });

	bench
		.add('xml-tokenizer', () => {
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
		})
		.add('xml-tokenizer (dom)', () => {
			const dom = xmlToSimplifiedObject(xml);
			const cacheKey = dom._HotelListResponse[0]._cacheKey[0].text;
		})
		.add('txml', () => {
			const dom = txml.parse(xml);
			const d = txml.simplifyLostLess(dom[0].children);
			const cacheKey = d.cacheKey[0];
		});
	// TODO: Can't make it work in browser env: ReferenceError: process is not defined
	// .add('amaro', async () => {
	// 	const result = await camaro.transform(xml, { raw: 'raw(/HotelListResponse/cacheKey)' });
	// 	console.log({ result });
	// });

	await bench.warmup();
	await bench.run();

	console.log('Select Xml node');
	console.table(
		bench
			.table()
			.sort(
				(a, b) =>
					parseInt(b?.['ops/sec'].toString() ?? '0') - parseInt(a?.['ops/sec'].toString() ?? '0')
			)
	);
}
