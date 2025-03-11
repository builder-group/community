import path from 'node:path';
import * as pc from 'picocolors';
import type { Plugin, RollupOptions } from 'rollup';
import { dts } from 'rollup-plugin-dts';
import type { CompilerOptions } from 'typescript';
import { VIRTUAL_ENTRY_ID, virtualEntryPlugin } from '../../plugins';
import { getExeca } from '../cached-imports';

export function createRollupDtsConfig(config: TRollupDtsConfig): RollupOptions {
	const {
		tsConfigPath,
		outputPath,
		inputPath,
		preserveModules = true,
		compilerOptions = {}
	} = config;

	if (preserveModules) {
		return {
			input: VIRTUAL_ENTRY_ID,
			logLevel: 'silent',
			plugins: [
				virtualEntryPlugin(),
				createGenerateDtsPlugin({
					tsConfigPath,
					outDir: path.dirname(outputPath)
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

// TODO: Replace with 'rollup-plugin-ts-declarations'
function createGenerateDtsPlugin(options: { tsConfigPath: string; outDir: string }): Plugin {
	const { tsConfigPath, outDir } = options;

	return {
		name: 'generate-dts',
		async buildStart() {
			try {
				console.log(`Generating TypeScript declarations in ${pc.underline(outDir)}`);

				const { execa } = await getExeca();
				await execa('pnpm', [
					'tsc',
					'--emitDeclarationOnly',
					'--project',
					path.resolve(process.cwd(), tsConfigPath),
					'--outDir',
					outDir,
					'--declarationDir',
					outDir
				]);

				console.log(pc.green('✓ TypeScript declarations generated'));
			} catch (error) {
				console.error(pc.red('Failed to generate TypeScript declarations:'));
				console.error(error);
				process.exit(1);
			}
		}
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
}
