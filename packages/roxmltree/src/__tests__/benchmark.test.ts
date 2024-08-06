import { readFile } from 'node:fs/promises';
import * as txml from 'txml';
import { beforeAll, describe, test } from 'vitest';

describe('xmlToObject function', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/sample.xml`, 'utf-8');
	});

	test('txml', () => {
		const result = txml.parse(xml);
		console.log(result);
	});
});
