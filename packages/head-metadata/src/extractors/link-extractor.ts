import { TCollectionExtractor } from '../types';

export const linkExtractor = {
	type: 'collection' as const,
	parent: 'link' as const,
	callback: (node) => {
		const rel = node.attributes.find((a) => a.local === 'rel');
		const href = node.attributes.find((a) => a.local === 'href');
		if (rel != null && href != null) {
			return { key: rel.value, value: href.value };
		}

		return null;
	}
} satisfies TCollectionExtractor;
