import { describe, expect, it } from 'vitest';
import { titleExtractor } from './title-extractor';

describe('titleExtractor callback', () => {
	it('should trim surrounding title whitespace', () => {
		expect(
			titleExtractor.callback({
				local: 'title',
				attributes: [],
				content: ['  Cats & Dogs\n']
			})
		).toBe('Cats & Dogs');
	});

	it('should skip titles without text', () => {
		expect(titleExtractor.callback({ local: 'title', attributes: [], content: [] })).toBeNull();
	});
});
