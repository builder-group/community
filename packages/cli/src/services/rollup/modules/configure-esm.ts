import path from 'node:path';

import type { TConfigureModuleConfig, TConfigureModuleResponse } from '.';

export function configureESM(config: TConfigureModuleConfig): TConfigureModuleResponse {
	const { outputOptions, outputPath } = config;
	const preserveModules = outputOptions.preserveModules ?? true;

	return {
		output: {
			...outputOptions,
			...{
				[preserveModules ? 'dir' : 'file']: outputPath,
				format: 'esm',
				preserveModules,
				inlineDynamicImports: !preserveModules
			}
		},
		visualizeFilePath: path.resolve(process.cwd(), './.dyn/stats-esm.html')
	};
}
