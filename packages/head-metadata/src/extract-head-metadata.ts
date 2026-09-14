import { decodeHTML, decodeHTMLAttribute } from 'entities';
import { htmlConfig, select, type TXmlNode } from 'xml-tokenizer';
import { type TCollectionExtractor, type TExtractor, type TExtractors } from './types';

/**
 * Extracts configured metadata from the first `<head>` element.
 *
 * Config keys name output fields, while each extractor's `tag` selects an HTML
 * element. Collections contain every non-null result in document order. Singles
 * keep the first non-null result and are omitted when no value is found.
 *
 * Attribute values and ordinary text are decoded before callbacks run. Script,
 * style, and CDATA content remain literal. Tokenizer and callback errors propagate.
 */
export function extractHeadMetadata<GExtractors extends TExtractors>(
	html: string,
	extractors: GExtractors
): TExtractMetadata<GExtractors> {
	const metadata = new Map<string, unknown>();

	const extractorsByTag = new Map<string, [string, TExtractor][]>();
	for (const [key, extractor] of Object.entries(extractors)) {
		const entries = extractorsByTag.get(extractor.tag) ?? [];
		entries.push([key, extractor]);
		extractorsByTag.set(extractor.tag, entries);
		if (extractor.type === 'collection') {
			metadata.set(key, []);
		}
	}

	// Note: Keep one stack entry per open element. `null` marks an element that no
	// extractor targets and that is outside a collected subtree. Its descendants
	// are still scanned for extractor tags.
	const stack: (TXmlNode | null)[] = [];
	select(
		html,
		[[{ axis: 'self-or-descendant', local: 'head' }]],
		(token, stream) => {
			switch (token.type) {
				case 'SelectionEnd': {
					stream.goToEnd();
					break;
				}
				case 'ElementStart': {
					const parent = stack[stack.length - 1];
					if (parent == null && !extractorsByTag.has(token.local)) {
						stack.push(null);
						break;
					}
					const node: TXmlNode = {
						local: token.local,
						prefix: token.prefix.length > 0 ? token.prefix : undefined,
						attributes: [],
						content: []
					};
					parent?.content.push(node);
					stack.push(node);
					break;
				}
				case 'ElementEnd': {
					if (token.end.type === 'Open') {
						break;
					}
					const node = stack.pop();
					if (node == null) {
						break;
					}
					// Note: Process a collected subtree after its outermost node closes so callbacks
					// receive complete nodes in document order
					if (stack[stack.length - 1] == null) {
						collectNodeAndDescendants(node);
					}
					break;
				}
				case 'Attribute': {
					const node = stack[stack.length - 1];
					node?.attributes.push({
						local: token.local,
						prefix: token.prefix.length > 0 ? token.prefix : undefined,
						value: decodeHTMLAttribute(token.value)
					});
					break;
				}
				case 'Text':
				case 'Cdata': {
					const node = stack[stack.length - 1];
					if (node == null) {
						break;
					}
					const isRawText = node.local === 'script' || node.local === 'style';
					const text = token.type === 'Cdata' || isRawText ? token.text : decodeHTML(token.text);
					if (text.trim().length > 0) {
						node.content.push(text);
					}
					break;
				}
			}
		},
		htmlConfig
	);

	function collectNodeAndDescendants(node: TXmlNode): void {
		for (const [key, extractor] of extractorsByTag.get(node.local) ?? []) {
			if (extractor.type === 'single' && metadata.has(key)) {
				continue;
			}
			const value = extractor.callback(node);
			if (value == null) {
				continue;
			}
			if (extractor.type === 'collection') {
				(metadata.get(key) as unknown[]).push(value);
			} else {
				metadata.set(key, value);
			}
		}
		for (const child of node.content) {
			if (typeof child !== 'string') {
				collectNodeAndDescendants(child);
			}
		}
	}

	return Object.fromEntries(metadata) as TExtractMetadata<GExtractors>;
}

export type TExtractMetadata<GExtractors extends TExtractors> = {
	[
		K in keyof GExtractors as GExtractors[K]['type'] extends 'collection' ? never : K
	]?: TExtractorResult<GExtractors[K]>;
} & {
	[
		K in keyof GExtractors as GExtractors[K]['type'] extends 'collection' ? K : never
	]: TExtractorResult<GExtractors[K]>;
};

type TExtractorResult<GExtractor extends TExtractor> = GExtractor extends TCollectionExtractor
	? NonNullable<ReturnType<GExtractor['callback']>>[]
	: NonNullable<ReturnType<GExtractor['callback']>>;
