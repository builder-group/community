import { readFile } from 'node:fs/promises';
import { beforeAll, describe, test } from 'vitest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Ok
// @ts-ignore -- Ok
import { initWasm, xmlToObjectWasm } from '../../dist/esm';

describe('xmlToObject function', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
		await initWasm();
	});

	test('xmlToObject', () => {
		const result = xmlToObjectWasm(xml);
		console.log(result);
	});
});
