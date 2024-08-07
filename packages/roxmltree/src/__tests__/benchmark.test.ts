import { readFile } from 'node:fs/promises';
import * as txml from 'txml';
import { beforeAll, describe, test } from 'vitest';

import { xmlToObject } from '../xml-to-object';

describe('xmlToObject function', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/sample.xml`, 'utf-8');
	});

	test('txml', () => {
		const result = txml.parse(xml);
		console.log(result);
	});

	test('roxmltree', () => {
		const result = xmlToObject(xml);
		console.log(result);
	});
});
