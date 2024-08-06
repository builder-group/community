import { readFile } from 'node:fs/promises';
import { beforeAll, describe, test } from 'vitest';

import { initWasm, parseXml, type WT } from '../wasm';

describe('xmlToObject function', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
		await initWasm();
	});

	test('xmlToObject', () => {
		parseXml(xml, true, (token: WT.Token) => {
			console.log({ token });
		});
	});
});
