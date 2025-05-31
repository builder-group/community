import { TCollectionExtractor } from '../types';

export const metaExtractor = {
	type: 'collection' as const,
	parent: 'meta' as const,
	callback: (node) => {
		const charset = node.attributes.find((a) => a.local === 'charset');
		if (charset != null) {
			return { key: 'charset', value: charset.value };
		}

		const name = node.attributes.find((a) => a.local === 'name' || a.local === 'property');
		const content = node.attributes.find((a) => a.local === 'content');
		if (name != null && content != null) {
			return { key: name.value, value: content.value };
		}

		return null;
	}
} satisfies TCollectionExtractor;
