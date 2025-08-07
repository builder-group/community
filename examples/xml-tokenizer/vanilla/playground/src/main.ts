import * as fxp from 'fast-xml-parser';
import { Parser } from 'stream-xml/dist/parser';
import { Bench } from 'tinybench';
// @ts-expect-error -- Javascript module
import * as txml from 'txml';
import {
	select,
	tokenize,
	xmlToObject,
	xmlToSimplifiedObject,
	type TXmlToken
} from 'xml-tokenizer';

// playground();
benchmarkTest();

async function playground(): Promise<void> {
	const dom = txml.parse('<root test="2"><child attr="1">One</child><child>Two</child></root>');
	const simplified = txml.simplify(dom);
	const simplifiedLostLess = txml.simplifyLostLess(dom);
	console.log({ simplified, simplifiedLostLess });
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

	await bench.run();

	console.log('Xml to object');
	console.table(
		bench.table().sort((a, b) => {
			// Extract the numeric part before the ± symbol
			const aOps = parseFloat(a?.['Throughput avg (ops/s)']?.toString().split('±')[0] ?? '0');
			const bOps = parseFloat(b?.['Throughput avg (ops/s)']?.toString().split('±')[0] ?? '0');
			return bOps - aOps; // Sort in descending order (fastest first)
		})
	);
}

async function bench2(xml: string, time = 100) {
	const bench = new Bench({ time });
	const expectedCacheKey = '-48a4e19f:15bec159775:50eb';

	// Convert string to Uint8Array for stream-xml
	const xmlBuffer = new TextEncoder().encode(xml);

	bench
		.add('xml-tokenizer (select)', () => {
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
			if (cacheKey !== expectedCacheKey) {
				throw new Error('Invalid cache key');
			}
		})
		.add('xml-tokenizer (native)', () => {
			let cacheKey = '';
			let inCacheKey = false;

			tokenize(xml, (token: TXmlToken) => {
				switch (token.type) {
					case 'ElementStart':
						if (token.local === 'cacheKey') {
							inCacheKey = true;
						}
						break;
					case 'Text':
						if (inCacheKey) {
							cacheKey = token.text.trim();
						}
						break;
					case 'ElementEnd':
						if (token.end.type === 'Close' && token.end.local === 'cacheKey') {
							inCacheKey = false;
						}
						break;
				}
			});

			if (cacheKey !== expectedCacheKey) {
				throw new Error('Invalid cache key');
			}
		})
		.add('xml-tokenizer (dom)', () => {
			const dom = xmlToSimplifiedObject(xml);
			const cacheKey = dom._HotelListResponse[0]._cacheKey[0].text;
			if (cacheKey !== expectedCacheKey) {
				throw new Error('Invalid cache key');
			}
		})
		.add('stream-xml', () => {
			let cacheKey = '';
			let inCacheKey = false;
			const parser = new Parser();

			parser.onElement(
				'cacheKey',
				() => {
					inCacheKey = true;
				},
				() => {
					inCacheKey = false;
				}
			);

			parser.onTextNode(() => {
				if (inCacheKey) {
					cacheKey = parser.textContent().trim();
				}
			});

			parser.parse(xmlBuffer);

			if (cacheKey !== expectedCacheKey) {
				throw new Error('Invalid cache key');
			}
		})
		.add('txml', () => {
			const dom = txml.parse(xml);
			const d = txml.simplifyLostLess(dom[0].children);
			const cacheKey = d.cacheKey[0];
			if (cacheKey !== expectedCacheKey) {
				throw new Error('Invalid cache key');
			}
		});
	// TODO: Can't make it work in browser env: ReferenceError: process is not defined
	// .add('amaro', async () => {
	// 	const result = await camaro.transform(xml, { raw: 'raw(/HotelListResponse/cacheKey)' });
	// 	console.log({ result });
	// });

	await bench.run();

	console.log('Select Xml node');
	console.table(
		bench.table().sort((a, b) => {
			// Extract the numeric part before the ± symbol
			const aOps = parseFloat(a?.['Throughput avg (ops/s)']?.toString().split('±')[0] ?? '0');
			const bOps = parseFloat(b?.['Throughput avg (ops/s)']?.toString().split('±')[0] ?? '0');
			return bOps - aOps; // Sort in descending order (fastest first)
		})
	);
}
