import { defineConfig as rollupDefineConfig, type RollupOptions } from 'rollup';
import type { PackageJson } from 'type-fest';

import type { DynCommand } from '../../../../DynCommand';
import type { TBaseDynRollupOptions, TDynFigmaConfig } from '../../../dyn';
import { mergeRollupConfigs } from '../../merge-rollup-configs';
import { configureCJS, type TConfigureModuleConfig } from '../../modules';
import { createAppRollupConfig } from './rollup.config.base.app';
import { createPluginRollupConfig } from './rollup.config.base.plugin';
import {
	createOverrideRollupConfig,
	type TDynBaseRollupOptionsCallbackConfig
} from './rollup.config.override';

export async function createFigmaRollupConfig(
	command: DynCommand,
	config: TCreateFigmaConfigConfig
): Promise<[RollupOptions, RollupOptions]> {
	const {
		tsConfigPath,
		packageJson,
		isProduction = false,
		sourcemap = true,
		figmaConfig = {},
		isWatchMode = false
	} = config;

	// Define configurations for the Figma app and plugin
	const figmaAppConfig = {
		source: './src/app/index.tsx',
		output: './dist/app.js',
		env: './.env.app',
		rollupOptions: {},
		postcssConfigPath: './postcss.config.js',
		...(figmaConfig.app ?? {})
	};
	const figmaPluginConfig = {
		source: './src/plugin/index.ts',
		output: './dist/plugin.js',
		env: './.env.plugin',
		rollupOptions: {},
		...(figmaConfig.plugin ?? {})
	};

	const finalConfigs: RollupOptions[] = [];

	// Generate Rollup configurations for each type (app/plugin)
	for (const [key, figmaModuleConfig] of Object.entries({
		app: figmaAppConfig,
		plugin: figmaPluginConfig
	})) {
		const moduleConfig: TConfigureModuleConfig = {
			outputPath: figmaModuleConfig.output,
			outputOptions: {
				name: packageJson.name,
				preserveModules: false,
				sourcemap
			}
		};

		const { output } = configureCJS(moduleConfig);

		const rollupOptionsCallbackConfig: TDynBaseRollupOptionsCallbackConfig = {
			paths: {
				input: figmaModuleConfig.source,
				output: figmaModuleConfig.output
			},
			output,
			tsConfigPath,
			packageJson,
			isProduction,
			isWatchMode,
			command,
			envPath: figmaModuleConfig.env
		};

		// Parse base configs and override options
		let baseRollupConfig: TBaseDynRollupOptions;
		if (key === 'app') {
			baseRollupConfig = await createAppRollupConfig({
				...rollupOptionsCallbackConfig,
				postcssConfigPath: figmaAppConfig.postcssConfigPath,
				htmlTemplatePath: figmaAppConfig.htmlTemplatePath
			});
		} else if (key === 'plugin') {
			baseRollupConfig = createPluginRollupConfig(rollupOptionsCallbackConfig);
		} else {
			continue; // Should never be reached
		}
		const overrideRollupOptions = await createOverrideRollupConfig(rollupOptionsCallbackConfig);

		// Merge override options into base config
		finalConfigs.push(
			rollupDefineConfig(mergeRollupConfigs(command, baseRollupConfig, overrideRollupOptions))
		);
	}

	return finalConfigs as [RollupOptions, RollupOptions];
}

export interface TCreateFigmaConfigConfig {
	tsConfigPath: string;
	packageJson: PackageJson;
	isProduction?: boolean;
	isWatchMode?: boolean;
	sourcemap?: boolean;
	figmaConfig?: TDynFigmaConfig;
}
