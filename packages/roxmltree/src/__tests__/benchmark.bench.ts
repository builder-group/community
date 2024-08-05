import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import { XMLParser } from 'fast-xml-parser';
import { beforeAll, bench } from 'vitest';

import { xmlToObject } from '../xml-to-object';

const parser = new XMLParser();

void describe('xmlToObject function', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
	});

	bench('xmlToObject', () => {
		const result = xmlToObject(xml);
		console.log(result);
	});

	bench('fast-xml-parser', () => {
		parser.parse(xml);
	});
});
