import { OutputOptions } from 'rollup';

export function createCjsRollupOutputConfig(config: {
	outputPath: string;
	outputOptions: OutputOptions;
}): OutputOptions {
	const { outputOptions, outputPath } = config;
	const { preserveModules = true } = outputOptions;

	return {
		...outputOptions,
		[preserveModules ? 'dir' : 'file']: outputPath,
		format: 'cjs',
		exports: 'named',
		preserveModules,
		inlineDynamicImports: !preserveModules
	};
}
