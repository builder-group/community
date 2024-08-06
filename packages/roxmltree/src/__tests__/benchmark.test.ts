import { readFile } from 'node:fs/promises';
import * as txml from 'txml';
import { beforeAll, describe, test } from 'vitest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Ok
// @ts-ignore -- Ok
import { initWasm, xml_to_object } from '../../dist/esm';

describe('xmlToObject function', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/sample.xml`, 'utf-8');
		await initWasm();
	});

	test('xmlToObject', () => {
		const result = xml_to_object(xml);
		console.log(result);
	});

	test('txml', () => {
		const result = txml.parse(xml);
		console.log(result);
	});
});
