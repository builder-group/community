import path from 'node:path';
import type { RollupOptions } from 'rollup';
import { dts } from 'rollup-plugin-dts';
import type { CompilerOptions } from 'typescript';
import { tsDeclarationsPlugin } from '../../plugins';

export function createRollupDtsConfig(config: TRollupDtsConfig): RollupOptions {
	const {
		tsConfigPath,
		outputPath,
		inputPath,
		preserveModules = true,
		compilerOptions = {},
		extension = '.ts'
	} = config;

	if (preserveModules) {
		return {
			input: inputPath,
			output: {
				dir: path.dirname(outputPath)
			},
			plugins: [
				tsDeclarationsPlugin({
					tsConfigPath,
					compilerOptions,
					extension,
					diagnosticsLevel: 'warn'
				})
			]
		};
	}

	return {
		input: inputPath,
		output: {
			file: outputPath
		},
		plugins: [
			dts({
				respectExternal: true,
				tsconfig: tsConfigPath,
				compilerOptions: {
					outDir: path.dirname(outputPath),
					declarationDir: path.dirname(outputPath),
					...compilerOptions
				}
			})
		]
	};
}

export interface TRollupDtsConfig {
	/**
	 * Path to the input TypeScript file
	 * @example './src/index.ts'
	 */
	inputPath: string;

	/**
	 * Path where declaration files will be output
	 * @example './dist/types/index.d.ts'
	 */
	outputPath: string;

	/**
	 * Path to tsconfig.json file
	 * @example './tsconfig.json'
	 */
	tsConfigPath: string;

	/**
	 * Whether to preserve the module structure
	 * @default true
	 */
	preserveModules?: boolean;

	/**
	 * Additional TypeScript compiler options that will be merged with
	 * the ones from tsconfig.json
	 */
	compilerOptions?: CompilerOptions;

	/**
	 * File extension to emit
	 * @default '.ts'
	 */
	extension?: '.ts' | '.cts' | '.mts' | `.${string}`;
}
