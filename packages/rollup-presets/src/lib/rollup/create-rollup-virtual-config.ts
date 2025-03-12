import { Plugin, RollupOptions } from 'rollup';
import { VIRTUAL_ENTRY_ID, virtualEntryPlugin } from '../../plugins';

export function createRollupVirtualConfig(config: RollupVirtualConfig): RollupOptions {
	const { name, execute } = config;

	return {
		input: VIRTUAL_ENTRY_ID,
		logLevel: 'silent',
		plugins: [
			virtualEntryPlugin(),
			{
				name,
				async generateBundle() {
					await execute();
				}
			} as Plugin
		]
	};
}

export interface RollupVirtualConfig {
	/**
	 * Name of the Rollup plugin
	 */
	name: string;

	/**
	 * Function to execute inside Rollup context
	 */
	execute: () => Promise<void> | void;
}
