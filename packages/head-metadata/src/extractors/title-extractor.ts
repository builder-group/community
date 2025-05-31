import { TSingleExtractor } from '../types';

export const titleExtractor = {
	type: 'single' as const,
	key: 'title' as const,
	callback: (node) => {
		const text = node.content[0];
		return typeof text === 'string' ? text.trim() : null;
	}
} satisfies TSingleExtractor;
