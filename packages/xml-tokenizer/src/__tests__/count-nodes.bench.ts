import { readFile } from 'node:fs/promises';
import { describe } from 'node:test';
import * as sax from 'sax';
import * as saxen from 'saxen';
import { beforeAll, bench, expect } from 'vitest';
// import * as xt from 'xml-tokenizer';

import { tokenize } from '../index';

void describe('count nodes', () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
	});

	bench('[xml-tokenizer]', () => {
		let nodeCount = 0;
		tokenize(xml, (token) => {
			if (token.type === 'ElementStart') {
				nodeCount++;
			}
		});

		expect(nodeCount).toBe(10045);
	});

	// bench('[xml-tokenizer (npm)]', () => {
	// 	let nodeCount = 0;
	// 	xt.tokenize(xml, (token) => {
	// 		if (token.type === 'ElementStart') {
	// 			nodeCount++;
	// 		}
	// 	});

	// 	expect(nodeCount).toBe(10045);
	// });

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
