import { readFile } from 'node:fs/promises';
import { beforeAll, describe, test } from 'vitest';

import { xmlToObject } from '../xml-to-object';

void describe('xmlToObject function', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
	});

	test('xmlToObject', () => {
		const result = xmlToObject(xml);
		console.log(result);
	});
});
