import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as rox from 'roxmltree';
import * as sax from 'sax';
import * as saxen from 'saxen';
import { beforeAll, bench, expect } from 'vitest';

import { ByteXmlStream, parseXmlStream, TextXmlStream } from '../index';

void describe('count nodes', () => {
	let xml = '';
	let xmlBytes: Uint8Array;

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
		xmlBytes = new TextEncoder().encode(xml);
	});

	bench('[roxmltree:text]', () => {
		let nodeCount = 0;
		parseXmlStream(new TextXmlStream(xml), false, (token) => {
			if (token.type === 'ElementStart') {
				nodeCount++;
			}
		});

		expect(nodeCount).toBe(10045);
	});

	bench('[roxmltree:text:npm]', () => {
		let nodeCount = 0;
		rox.parseXmlStream(new rox.TextXmlStream(xml), false, (token) => {
			if (token.type === 'ElementStart') {
				nodeCount++;
			}
		});

		expect(nodeCount).toBe(10045);
	});

	bench('[roxmltree:byte]', () => {
		let nodeCount = 0;
		parseXmlStream(new ByteXmlStream(xmlBytes), false, (token) => {
			if (token.type === 'ElementStart') {
				nodeCount++;
			}
		});

		expect(nodeCount).toBe(10045);
	});

	bench('[saxen]', () => {
		let nodeCount = 0;
		const parser = new saxen.Parser();
		parser.on('openTag', () => {
			nodeCount++;
		});
		parser.parse(xml);

		expect(nodeCount).toBe(10045);
	});

	bench('[sax]', () => {
		let nodeCount = 0;
		const parser = sax.parser();
		parser.onopentag = () => {
			nodeCount++;
		};
		parser.write(xml).close();

		expect(nodeCount).toBe(10045);
	});
});
