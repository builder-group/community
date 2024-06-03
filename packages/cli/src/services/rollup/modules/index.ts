import type { OutputOptions } from 'rollup';

export * from './configure-cjs';
export * from './configure-esm';

export interface TConfigureModuleConfig {
	outputPath: string;
	outputOptions: OutputOptions;
}

export interface TConfigureModuleResponse {
	output: OutputOptions;
	visualizeFilePath: string;
}
