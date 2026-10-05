import { readFile } from 'node:fs/promises';
import * as sax from 'sax';
import * as saxen from 'saxen';
import { beforeAll, describe, expect, test } from 'vitest';
// import * as xt from 'xml-tokenizer';

import { tokenize } from '../index';

describe('count nodes', { timeout: 30_000 }, () => {
	let xml = '';

	beforeAll(async () => {
		xml = await readFile(`${__dirname}/resources/midsize.xml`, 'utf-8');
	});

	test('compare parsers', async ({ bench }) => {
		await bench.compare(
			bench('[xml-tokenizer]', () => {
				let nodeCount = 0;
				tokenize(xml, (token) => {
					if (token.type === 'ElementStart') {
						nodeCount++;
					}
				});

				expect(nodeCount).toBe(10045);
			}),

			// bench('[xml-tokenizer (npm)]', () => {
			// 	let nodeCount = 0;
			// 	xt.tokenize(xml, (token) => {
			// 		if (token.type === 'ElementStart') {
			// 			nodeCount++;
			// 		}
			// 	});

			// 	expect(nodeCount).toBe(10045);
			// }),

			bench('[saxen]', () => {
				let nodeCount = 0;
				const parser = new saxen.Parser();
				parser.on('openTag', () => {
					nodeCount++;
				});
				parser.parse(xml);

				expect(nodeCount).toBe(10045);
			}),

			bench('[sax]', () => {
				let nodeCount = 0;
				const parser = sax.parser();
				parser.onopentag = () => {
					nodeCount++;
				};
				parser.write(xml).close();

				expect(nodeCount).toBe(10045);
			})
		);
	});
});
