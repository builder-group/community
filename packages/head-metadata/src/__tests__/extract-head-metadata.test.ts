import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractHeadMetadata } from '../extract-head-metadata';
import { linkExtractor, metaExtractor, titleExtractor } from '../extractors';

describe('head metadata integration', () => {
	it('should extract metadata from HTML fixtures', async () => {
		const directory = join(__dirname, 'resources/e2e');
		const files = await readdir(directory);
		const htmlFiles = files.filter((file) => file.endsWith('.html')).sort();
		expect(htmlFiles.length).toBeGreaterThan(0);

		for (const file of htmlFiles) {
			const html = await readFile(join(directory, file), 'utf-8');
			const expected = JSON.parse(
				await readFile(join(directory, file.replace(/\.html$/, '.json')), 'utf-8')
			);
			const metadata = extractHeadMetadata(html, {
				title: titleExtractor,
				meta: metaExtractor,
				links: linkExtractor
			});

			expect(metadata, file).toEqual(expected);
		}
	});
});
