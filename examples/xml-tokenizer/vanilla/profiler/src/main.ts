import * as fxp from 'fast-xml-parser';
import * as txml from 'txml';
import { xmlToObject } from 'xml-tokenizer';
import * as xml2js from 'xml2js';

import { bench } from './bench';
import { parse } from './txml';

midsizeTest();
// shopifyTest();
// benchmarkTest();

async function midsizeTest(): Promise<void> {
	const xmlResult = await fetch('http://localhost:5173/midsize.xml');
	const xml = await xmlResult.text();

	const result = xmlToObject(xml);

	console.log({ result });
}

async function shopifyTest(): Promise<void> {
	const shopifyResult = await fetch(
		'https://cors-anywhere.herokuapp.com/https://apps.shopify.com/search?page=1&q=test',
		{
			headers: {
				'Accept': 'text/html, application/xhtml+xml',
				'Turbo-Frame': 'search_page'
			}
		}
	);
	const shopifyHtml = await shopifyResult.text();

	// const tokens: TXMLToken[] = [];
	// try {
	// 	parseString(shopifyHtml, false, (token) => {
	// 		tokens.push(token);
	// 	});

	// } catch (e) {
	// 	// do nothing
	// }

	const result = xmlToObject(shopifyHtml);
	console.log({ result, shopifyHtml });
}

async function benchmarkTest(): Promise<void> {
	const xmlResult = await fetch('http://localhost:5173/midsize.xml');
	const xml = await xmlResult.text();

	console.log({ xml });

	const fastXmlParser = new fxp.XMLParser();

	const runs = 100;

	bench('xml-tokenizer', () => xmlToObject(xml), runs);
	bench('txml-ts', () => parse(xml), runs);
	bench('txml', () => txml.parse(xml), runs);
	bench('fast-xml-parser', () => fastXmlParser.parse(xml), runs);
	bench('xml2js', () => xml2js.parseString(xml, () => {}), runs);
}
