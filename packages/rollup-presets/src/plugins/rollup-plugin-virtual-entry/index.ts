import type { Plugin } from 'rollup';

export const VIRTUAL_ENTRY_ID = 'virtual-entry';

export function virtualEntryPlugin(): Plugin {
	return {
		name: 'virtual-entry',
		resolveId(id) {
			if (id === VIRTUAL_ENTRY_ID) {
				return id;
			}
			return null;
		},
		load(id) {
			if (id === VIRTUAL_ENTRY_ID) {
				return 'export {}';
			}
			return null;
		}
	};
}
