import { describe, expect, expectTypeOf, it } from 'vitest';
import { extractHeadMetadata } from './extract-head-metadata';
import { type TCollectionExtractor, type TSingleExtractor } from './types';

describe('extractHeadMetadata function', () => {
	const valuesExtractor = {
		tag: 'meta',
		type: 'collection',
		callback: (node) => {
			const value = node.attributes.find((attr) => attr.local === 'content')?.value;
			return value != null ? Number(value) : null;
		}
	} satisfies TCollectionExtractor<number>;

	it('should retain output fields when the extractor kind is chosen dynamically', () => {
		function extract(extractor: TSingleExtractor<string> | TCollectionExtractor<string>) {
			return extractHeadMetadata('<head><title>Example</title></head>', { value: extractor });
		}
		const metadata = extract({ tag: 'title', type: 'single', callback: () => 'Example' });
		expect(metadata.value).toBe('Example');
		expectTypeOf(metadata.value).toEqualTypeOf<string | string[] | undefined>();
	});

	it('should collect values in order and keep the first non-null single result', () => {
		const metadata = extractHeadMetadata(
			'<head><meta><meta content="0"><meta content="2"><meta content="0"></head>',
			{
				values: valuesExtractor,
				first: { ...valuesExtractor, type: 'single' }
			}
		);
		expect(metadata).toEqual({ values: [0, 2, 0], first: 0 });
		expectTypeOf(metadata.values).toEqualTypeOf<number[]>();
		expectTypeOf(metadata.first).toEqualTypeOf<number | undefined>();
	});

	it('should return empty collections and omit unmatched singles', () => {
		expect(
			extractHeadMetadata('<head></head>', {
				values: valuesExtractor,
				first: { ...valuesExtractor, type: 'single' }
			})
		).toEqual({ values: [] });
	});

	it('should decode attributes and text before calling extractors', () => {
		const metadata = extractHeadMetadata(
			'<HEAD><CUSTOM DATA-VALUE="A&amp;B">Cats &amp; Dogs</CUSTOM></HEAD>',
			{
				decoded: {
					tag: 'custom',
					type: 'single',
					callback: (node) => ({
						attributes: node.attributes.map(({ local, value }) => [local, value]),
						content: node.content
					})
				}
			}
		);
		expect(metadata.decoded).toEqual({
			attributes: [['data-value', 'A&B']],
			content: ['Cats & Dogs']
		});
	});

	it('should extract selected subtrees in document order without confusing child boundaries', () => {
		const extractor = {
			tag: 'custom',
			type: 'collection',
			callback: (node) => ({
				id: node.attributes.find((attr) => attr.local === 'id')?.value,
				content: node.content.map((child) => (typeof child === 'string' ? child : child.local))
			})
		} satisfies TCollectionExtractor;
		const metadata = extractHeadMetadata(
			'<head><custom id="outer"><other id="ignored">Text</other><custom id="inner">Inner</custom>After</custom></head>',
			{ nodes: extractor }
		);
		expect(metadata.nodes).toEqual([
			{ id: 'outer', content: ['other', 'custom', 'After'] },
			{ id: 'inner', content: ['Inner'] }
		]);
	});

	it('should preserve script content and stop after the first head', () => {
		const scriptExtractor = {
			tag: 'script',
			type: 'collection',
			callback: (node) => node.content[0] ?? null
		} satisfies TCollectionExtractor;
		const metadata = extractHeadMetadata(
			'<head><script>"&amp;"</script></head><head><script>ignored</script></head>',
			{ scripts: scriptExtractor }
		);
		expect(metadata.scripts).toEqual(['"&amp;"']);
	});
});
