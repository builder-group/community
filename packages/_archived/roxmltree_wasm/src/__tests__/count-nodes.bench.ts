import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as sax from 'sax';
import * as saxen from 'saxen';
import { beforeAll, bench, expect } from 'vitest';
import { parseXmlStream, TextXmlStream } from '../tokenizer';

void describe('count nodes', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/bpmn.xml`, 'utf-8');
	});

	bench('[roxmltree:text]', () => {
		let nodeCount = 0;
		parseXmlStream(new TextXmlStream(xml), false, (token) => {
			if (token.type === 'ElementStart') {
				nodeCount++;
			}
		});

		expect(nodeCount).toBe(1497);
	});

	bench('[saxen]', () => {
		let nodeCount = 0;
		const parser = new saxen.Parser();
		parser.on('openTag', () => {
			nodeCount++;
		});
		parser.parse(xml);

		expect(nodeCount).toBe(1497);
	});

	bench('[sax]', () => {
		let nodeCount = 0;
		const parser = sax.parser();
		parser.onopentag = () => {
			nodeCount++;
		};
		parser.write(xml).close();

		expect(nodeCount).toBe(1497);
	});
});
