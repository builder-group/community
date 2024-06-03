import chalk from 'chalk';
import { defineConfig as rollupDefineConfig, type RollupOptions } from 'rollup';
import type { PackageJson } from 'type-fest';

import type { DynCommand } from '../../../../DynCommand';
import { resolvePaths, toArray, type TInputOutputPath } from '../../../../utils';
import type { TDynNodeConfig, TDynRollupOptionsCallbackConfig } from '../../../dyn';
import { mergeRollupConfigs } from '../../merge-rollup-configs';
import { configureCJS, type TConfigureModuleConfig } from '../../modules';
import { createBaseRollupConfig } from './rollup.config.base';

export async function createNodeRollupConfig(
	command: DynCommand,
	config: TCreateNodeConfigConfig
): Promise<RollupOptions[]> {
	const {
		tsConfigPath,
		packageJson,
		nodeConfig = {},
		isProduction = false,
		bundleDeps = false
	} = config;
	const paths = resolvePaths({
		paths: config.paths ?? null,
		packageJson,
		format: 'cjs',
		preserveModules: false
	});
	const rollupConfig = nodeConfig.rollupConfig ?? { isBase: false, options: {} };

	command.log(
		`🛣️  Resolved paths from ${chalk.underline('package.json')}'s export conditions${
			command.isVerbose ? `: ${chalk.gray(JSON.stringify(paths))}` : '.'
		}`
	);

	const finalConfigs: RollupOptions[] = [];
	for (const pathItem of paths) {
		const { input: inputPath, output: outputPath } = pathItem;
		const moduleConfig: TConfigureModuleConfig = {
			outputPath,
			outputOptions: {
				name: packageJson.name,
				preserveModules: false,
				sourcemap: false
			}
		};

		const { output } = configureCJS(moduleConfig);

		const rollupOptionsCallbackConfig: TDynRollupOptionsCallbackConfig = {
			paths: {
				input: inputPath,
				output: outputPath
			},
			output,
			tsConfigPath,
			packageJson,
			isProduction,
			command
		};

		// Parse base config and override options
		const baseRollupConfig = await createBaseRollupConfig({
			...rollupOptionsCallbackConfig,
			bundleDeps
		});
		const rollupOptions = toArray(
			typeof rollupConfig.options === 'object'
				? rollupConfig.options
				: await rollupConfig.options(rollupOptionsCallbackConfig)
		);

		// Merge rollup options and base config
		for (const rollupOption of rollupOptions) {
			finalConfigs.push(
				rollupDefineConfig(
					rollupConfig.isBase
						? mergeRollupConfigs(command, rollupOption, baseRollupConfig)
						: mergeRollupConfigs(command, baseRollupConfig, rollupOption)
				)
			);
		}
	}

	return finalConfigs;
}

export interface TCreateNodeConfigConfig {
	tsConfigPath: string;
	packageJson: PackageJson;
	paths?: TInputOutputPath | TInputOutputPath[];
	isProduction?: boolean;
	bundleDeps?: boolean;
	nodeConfig?: TDynNodeConfig;
}
