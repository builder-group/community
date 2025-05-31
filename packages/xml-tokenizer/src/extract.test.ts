import { describe, expect, it } from 'vitest';
import { htmlConfig } from './config';
import { extract, type TExtractor } from './extract';

describe('extract function', () => {
	const sampleHtml = `
		<div class="container main">
			<article class="item featured" data-id="123">
				<h2 class="title">Sample Title</h2>
				<p class="description">Sample description</p>
				<span class="price">$100</span>
			</article>
		</div>
	`;

	it('should handle empty extractors', () => {
		const result = extract(sampleHtml, [], htmlConfig);
		expect(result).toEqual({});
	});

	it('should merge extractor contexts', () => {
		const counter = {
			context: { count: 0 },
			extract: (token, cx) => {
				if (token.type === 'ElementStart') cx.count++;
			}
		} satisfies TExtractor;

		const collector = {
			context: { elements: [] as string[] },
			extract: (token, cx) => {
				if (token.type === 'ElementStart') {
					cx.elements.push(token.local);
				}
			}
		} satisfies TExtractor;

		const result = extract(sampleHtml, [counter, collector], htmlConfig);
		expect(result.count).toBe(5);
		expect(result.elements).toEqual(['div', 'article', 'h2', 'p', 'span']);
	});
});
