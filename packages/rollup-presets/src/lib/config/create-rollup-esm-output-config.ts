import { OutputOptions } from 'rollup';

export function createRollupEsmOutputConfig(config: {
	outputPath: string;
	extension?: `.${string}`;
	outputOptions: OutputOptions;
}): OutputOptions {
	const { outputOptions, outputPath, extension = '.mjs' } = config;
	const { preserveModules = true } = outputOptions;

	return {
		...outputOptions,
		[preserveModules ? 'dir' : 'file']: outputPath,
		format: 'esm',
		preserveModules,
		inlineDynamicImports: !preserveModules,
		entryFileNames: `[name]${extension}`
	};
}
