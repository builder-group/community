import { describe, expect, it } from 'vitest';
import { metaExtractor } from './meta-extractor';

describe('metaExtractor callback', () => {
	it('should preserve supported attributes and distinguish name from property', () => {
		const result = metaExtractor.callback({
			local: 'meta',
			attributes: [
				{ local: 'charset', value: 'UTF-8' },
				{ local: 'name', value: 'description' },
				{ local: 'property', value: 'og:description' },
				{ local: 'http-equiv', value: 'refresh' },
				{ local: 'content', value: 'Example' },
				{ local: 'id', value: 'ignored' }
			],
			content: []
		});
		expect(result).toEqual({
			charset: 'UTF-8',
			name: 'description',
			property: 'og:description',
			httpEquiv: 'refresh',
			content: 'Example'
		});
	});

	it('should skip elements without supported attributes', () => {
		expect(
			metaExtractor.callback({
				local: 'meta',
				attributes: [{ local: 'id', value: 'ignored' }],
				content: []
			})
		).toBeNull();
	});
});
