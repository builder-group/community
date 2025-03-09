import { OutputOptions } from 'rollup';

export function createRollupEsmOutputConfig(config: {
	outputPath: string;
	outputOptions: OutputOptions;
}): OutputOptions {
	const { outputOptions, outputPath } = config;
	const { preserveModules = true } = outputOptions;

	return {
		...outputOptions,
		[preserveModules ? 'dir' : 'file']: outputPath,
		format: 'esm',
		preserveModules,
		inlineDynamicImports: !preserveModules
	};
}
