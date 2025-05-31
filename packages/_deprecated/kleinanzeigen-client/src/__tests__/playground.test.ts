import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { extractAdsData } from '../extract-ads';
import { fetchAds } from '../fetch-ads';

describe('playground', () => {
	it('should pass', () => {
		expect(true).toBe(true);
	});

	describe('should work', () => {
		it('should fetch ads with basic search', async () => {
			const result = await fetchAds({
				query: 'laptop'
			});

			expect(result).toBeDefined();
			expect(result.html).toBeDefined();

			fs.writeFileSync(
				path.resolve(__dirname, './resources/e2e/s-laptop.html'),
				result.html,
				'utf-8'
			);
		});

		it('should extract complete listing data', () => {
			const html = fs.readFileSync(
				path.resolve(__dirname, './resources/e2e/s-laptop.html'),
				'utf-8'
			);

			const listings = extractAdsData(html);

			console.log('Extracted listings:', JSON.stringify(listings, null, 2));
		});
	});
});
