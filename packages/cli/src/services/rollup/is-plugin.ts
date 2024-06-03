import type { Plugin } from 'rollup';

export function isRollupPlugin(obj: unknown): obj is Plugin {
	return typeof obj === 'object' && obj !== null && 'name' in obj;
}
