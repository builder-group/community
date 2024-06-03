import type { InputPluginOption } from 'rollup';

import { isRollupPlugin } from './is-plugin';

export function pluginsToKeys(plugins: InputPluginOption): string[] {
	const parsedPlugins = Array.isArray(plugins) ? plugins : [plugins];
	return parsedPlugins.map((plugin) =>
		isRollupPlugin(plugin) ? plugin.name : JSON.stringify(plugin)
	);
}
