import { describe, expect, it } from 'vitest';
import { linkExtractor } from './link-extractor';

describe('linkExtractor callback', () => {
	it('should split token attributes and preserve link details', () => {
		const result = linkExtractor.callback({
			local: 'link',
			attributes: [
				{ local: 'rel', value: ' ICON\t alternate ' },
				{ local: 'href', value: '/Icon.PNG' },
				{ local: 'type', value: 'image/png' },
				{ local: 'sizes', value: '32x32  48x48' },
				{ local: 'media', value: '(prefers-color-scheme: dark)' },
				{ local: 'hreflang', value: 'de' }
			],
			content: []
		});
		expect(result).toEqual({
			rel: ['icon', 'alternate'],
			href: '/Icon.PNG',
			type: 'image/png',
			sizes: ['32x32', '48x48'],
			media: '(prefers-color-scheme: dark)',
			hreflang: 'de'
		});
	});

	it('should preserve non-ASCII whitespace within tokens', () => {
		const result = linkExtractor.callback({
			local: 'link',
			attributes: [
				{ local: 'rel', value: 'icon\u00a0' },
				{ local: 'href', value: '/icon.png' },
				{ local: 'sizes', value: '\u00a032x32' }
			],
			content: []
		});
		expect(result).toEqual({
			rel: ['icon\u00a0'],
			href: '/icon.png',
			sizes: ['\u00a032x32']
		});
	});

	it.each(['rel', 'href'])('should skip links missing %s', (missing) => {
		const attributes = [
			{ local: 'rel', value: 'icon' },
			{ local: 'href', value: '/icon.png' }
		].filter((attribute) => attribute.local !== missing);
		expect(linkExtractor.callback({ local: 'link', attributes, content: [] })).toBeNull();
	});
});
