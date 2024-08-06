import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import { XMLParser } from 'fast-xml-parser';
import * as txml from 'txml';
import { beforeAll, bench } from 'vitest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Ok
// @ts-ignore -- Ok
import { initWasm, xmlToObject, xmlToObjectWasm } from '../../dist/esm';

const parser = new XMLParser();

void describe('xml to object', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
		await initWasm();
	});

	bench('[roxmltree]', () => {
		xmlToObject(xml);
	});

	bench('[roxmltree:wasm]', () => {
		xmlToObjectWasm(xml);
	});

	bench('[fast-xml-parser]', () => {
		parser.parse(xml);
	});

	bench('[txml]', () => {
		txml.parse(xml);
	});
});
