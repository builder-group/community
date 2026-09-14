import { describe, expect, it } from 'vitest';
import { baseExtractor } from './base-extractor';

describe('baseExtractor callback', () => {
	it('should return the href without resolving it', () => {
		expect(
			baseExtractor.callback({
				local: 'base',
				attributes: [{ local: 'href', value: '/Assets/' }],
				content: []
			})
		).toBe('/Assets/');
	});

	it('should skip base elements without an href', () => {
		expect(
			baseExtractor.callback({
				local: 'base',
				attributes: [{ local: 'target', value: '_blank' }],
				content: []
			})
		).toBeNull();
	});
});
