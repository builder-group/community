import type { TSingleExtractor } from '../types';

/** Extracts trimmed text from a `<title>` element. */
export const titleExtractor = {
	type: 'single',
	tag: 'title',
	callback: (node) => {
		const text = node.content[0];
		return typeof text === 'string' ? text.trim() : null;
	}
} satisfies TSingleExtractor;
