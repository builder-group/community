import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import { XMLParser } from 'fast-xml-parser';
import * as rox from 'roxmltree';
import * as txml from 'txml';
import { beforeAll, bench } from 'vitest';

import { xmlToObject } from '../xml-to-object';

const parser = new XMLParser();

void describe('xml to object', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
		await rox.initWasm();
	});

	bench('[roxmltree]', () => {
		const document = new rox.Document();
		document.parse(xml);
	});

	bench('[roxmltree:local]', () => {
		xmlToObject(xml);
	});

	bench('[fast-xml-parser]', () => {
		parser.parse(xml);
	});

	bench('[txml]', () => {
		txml.parse(xml);
	});
});
