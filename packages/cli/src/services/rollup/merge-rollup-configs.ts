import { mergeWith } from 'lodash';
import type { InputPluginOption, Plugin, RollupOptions } from 'rollup';

import type { DynCommand } from '../../DynCommand';
import type { TBaseDynRollupOptions, TDynRollupPlugin } from '../dyn';
import { isRollupPlugin } from './is-plugin';

/**
 * Merges two Rollup configurations with special handling for plugins.
 *
 * @param baseConfig - The primary/base configuration to start with.
 * @param overrideOptions - The configuration that provides overriding values.
 * @param config - Settings for controlling placeholder behavior.
 * @returns - The merged configuration.
 */
export function mergeRollupConfigs(
	command: DynCommand,
	baseConfig: TBaseDynRollupOptions,
	overrideOptions: TBaseDynRollupOptions
): RollupOptions {
	const { plugins: basePlugins = [], ...restBaseConfig } = baseConfig;
	const { plugins: overridePlugins = [], ...restOverrideConfig } = overrideOptions;

	// Merge plugins manually as lodash customizer function didn't work out for my use case
	const mergedPlugins = mergePlugins(command, basePlugins, overridePlugins);

	// Use lodash mergeWith for the rest of the configuration
	const mergedConfig: Omit<RollupOptions, 'plugins'> = mergeWith(
		{},
		restBaseConfig,
		restOverrideConfig
	) as Omit<RollupOptions, 'plugins'>;

	return { ...mergedConfig, plugins: mergedPlugins };
}

/**
 * The function combines two lists of plugins by using one as a template (determined by the `pluginTemplate` option)
 * and replacing any string placeholders in that template with the actual plugin instances from the other list.
 * If a placeholder doesn't correspond to any plugin, a warning is logged.
 *
 * Two modes of operation are supported:
 * 1. Using the override list as a template (`pluginTemplate` set to 'override'), which will replace its placeholders
 *    with plugins from the base list.
 * 2. Using the base list as a template (`pluginTemplate` set to 'base'), which will replace its placeholders with
 *    plugins from the override list.
 *
 * @param basePlugins - List of plugins from the base configuration. This can contain actual plugin instances or string placeholders.
 * @param overridePlugins - List of plugins from the overriding configuration. This can also contain plugin instances or string placeholders.
 * @param config - Configuration object that contains the `command` for logging and `pluginTemplate` for determining which list to use as a template.
 * @returns - The merged list of plugins.
 */
function mergePlugins(
	command: DynCommand,
	basePlugins: TDynRollupPlugin[] | null,
	overridePlugins: TDynRollupPlugin[] | null
): InputPluginOption {
	const basePluginsArray = basePlugins ?? [];
	const overridePluginsArray = overridePlugins ?? [];

	const allPluginsMap = new Map<string, Plugin[]>();
	const template: TDynRollupPlugin[] = basePluginsArray;

	// Helper function to collect plugin instances into the all plugins map
	const gatherPlugins = (plugin: TDynRollupPlugin): void => {
		// We only care about Plugin objects with a name property
		if (isRollupPlugin(plugin)) {
			const key = plugin.name;
			if (allPluginsMap.has(key)) {
				allPluginsMap.get(key)?.push(plugin);
			} else {
				allPluginsMap.set(key, [plugin]);
			}
		}
	};

	// Collect plugins from the override
	overridePluginsArray.forEach(gatherPlugins);

	// Merge plugins
	const mergedPlugins: InputPluginOption = [];
	template.forEach((plugin) => {
		// Replace placeholders from the template with their respective plugin instances
		if (typeof plugin === 'string') {
			const respectivePlugin = allPluginsMap.get(plugin);
			if (respectivePlugin != null) {
				mergedPlugins.push(respectivePlugin);
			} else if (command.isVerbose) {
				command.warn(`Plugin placeholder "${plugin}" does not match any available plugins.`);
			}
		} else if (isRollupPlugin(plugin)) {
			mergedPlugins.push(plugin);
		}
	});

	return mergedPlugins;
}
