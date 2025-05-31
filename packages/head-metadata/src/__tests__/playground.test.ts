import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractHeadMetadata } from '../extract-head-metadata';
import { linkExtractor, metaExtractor, titleExtractor } from '../extractors';

describe('playground', () => {
	it('should work', async () => {
		const filePath = join(__dirname, './resources/e2e/bsky.html');
		const html = await readFile(filePath, 'utf-8');

		const metadata = await extractHeadMetadata(html, {
			meta: metaExtractor,
			title: titleExtractor,
			link: linkExtractor
		});

		expect(metadata).toBeDefined();
	});
});
