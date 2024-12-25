import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as fastXmlParser from 'fast-xml-parser';
import * as txml from 'txml';
import { beforeAll, bench, expect } from 'vitest';
import * as xml2js from 'xml2js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Ok
// @ts-ignore -- Ok
import { wasm, xmlToObject, xmlToObjectWasm } from '../../dist/esm';

void describe('xml to object', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
		await wasm.initWasm();
	});

	bench('[roxmltree:text]', () => {
		// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- Not void
		const result = xmlToObject(xml);
		expect(result).not.toBeNull();
	});

	bench('[roxmltree:wasmMix]', () => {
		// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- Not void
		const result = xmlToObjectWasm(xml);
		expect(result).not.toBeNull();
	});

	bench('[roxmltree:wasm]', () => {
		const result = wasm.xmlToObject(xml);
		expect(result).not.toBeNull();
	});

	bench('[fast-xml-parser]', () => {
		const parser = new fastXmlParser.XMLParser();
		const result = parser.parse(xml);
		expect(result).not.toBeNull();
	});

	bench('[txml]', () => {
		const result = txml.parse(xml);
		expect(result).not.toBeNull();
	});

	bench('[xml2js]', () => {
		xml2js.parseString(xml, (err, result) => {
			expect(result).not.toBeNull();
		});
	});
});
