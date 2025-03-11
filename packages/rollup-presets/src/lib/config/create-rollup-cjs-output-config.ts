import { OutputOptions } from 'rollup';

export function createRollupCjsOutputConfig(
	config: TCreateRollupCjsOutputConfigConfig
): OutputOptions {
	const { outputOptions, outputPath, extension = '.cjs' } = config;
	const { preserveModules = true } = outputOptions;

	return {
		...outputOptions,
		[preserveModules ? 'dir' : 'file']: outputPath,
		format: 'cjs',
		exports: 'named',
		preserveModules,
		inlineDynamicImports: !preserveModules,
		entryFileNames: `[name]${extension}`
	};
}

interface TCreateRollupCjsOutputConfigConfig {
	outputPath: string;
	extension?: `.${string}`;
	outputOptions: OutputOptions;
}
