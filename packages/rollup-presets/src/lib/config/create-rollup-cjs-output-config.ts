import { OutputOptions } from 'rollup';

export function createRollupCjsOutputConfig(config: {
	outputPath: string;
	extension?: `.${string}`;
	outputOptions: OutputOptions;
}): OutputOptions {
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
