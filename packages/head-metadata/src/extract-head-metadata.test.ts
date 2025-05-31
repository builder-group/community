import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractHeadMetadata } from './extract-head-metadata';
import { linkExtractor, metaExtractor, titleExtractor } from './extractors';

describe('extractHeadMetadata', () => {
	it('should extract metadata from all test files', async () => {
		// Get all HTML files from the e2e directory
		const testFiles = await readdir(join(__dirname, './__tests__/resources/e2e'));
		const htmlFiles = testFiles.filter((file) => file.endsWith('.html'));

		// Test each HTML file
		for (const htmlFile of htmlFiles) {
			const filePath = join(__dirname, './__tests__/resources/e2e', htmlFile);
			const html = await readFile(filePath, 'utf-8');

			// Get corresponding JSON file
			const jsonPath = filePath.replace('.html', '.json');
			const expectedResults = JSON.parse(await readFile(jsonPath, 'utf-8'));

			// Extract metadata and assert
			const metadata = await extractHeadMetadata(html, {
				meta: metaExtractor,
				title: titleExtractor,
				link: linkExtractor
			});
			expect(metadata).toEqual(expectedResults);
		}
	});
});
