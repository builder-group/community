import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as fastXmlParser from 'fast-xml-parser';
import * as rox from 'roxmltree';
import * as txml from 'txml';
import { beforeAll, bench, expect } from 'vitest';
import * as xml2js from 'xml2js';

import { xmlToObject } from '../index';

void describe('xml to object', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
	});

	bench('[roxmltree]', () => {
		const result = xmlToObject(xml);
		expect(result).not.toBeNull();
	});

	bench('[roxmltree:npm]', () => {
		const result = rox.xmlToObject(xml);
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
