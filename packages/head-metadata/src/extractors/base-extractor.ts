import type { TSingleExtractor } from '../types';

/** Extracts the unresolved `href` from a `<base>` element. */
export const baseExtractor = {
	type: 'single',
	tag: 'base',
	callback: (node) => node.attributes.find(({ local }) => local === 'href')?.value ?? null
} satisfies TSingleExtractor;
