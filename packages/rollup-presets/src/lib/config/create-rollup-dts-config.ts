import path from 'node:path';
import pc from 'picocolors';
import type { Plugin, RollupOptions } from 'rollup';
import { VIRTUAL_ENTRY_ID, virtualEntryPlugin } from '../../plugins';
import { getExeca } from '../cached-imports';

/**
 * Creates a rollup config for generating TypeScript declaration files.
 * Uses tsc to generate declarations and handles output paths based on package.json.
 *
 * @example Basic usage (outputs .d.ts files)
 * ```ts
 * createRollupDtsConfig({
 *   outDir: './dist/types'
 * });
 * ```
 *
 * @example With specific extension
 * ```ts
 * createRollupDtsConfig({
 *   extension: '.d.mts', // or '.d.cts' or '.d.ts'
 *   outDir: './dist/types'
 * });
 * ```
 */
export function createRollupDtsConfig(options: TRollupDtsConfig = {}): RollupOptions {
	const { tsConfigPath = 'tsconfig.json', extension = '.d.ts', outDir = './dist/types' } = options;

	return {
		input: VIRTUAL_ENTRY_ID,
		logLevel: 'silent',
		plugins: [
			virtualEntryPlugin(),
			createGenerateDtsPlugin({
				tsConfigPath,
				extension,
				outDir
			})
		]
	};
}

function createGenerateDtsPlugin(options: {
	tsConfigPath: string;
	extension: '.d.ts' | '.d.mts' | '.d.cts';
	outDir: string;
}): Plugin {
	const { tsConfigPath, extension, outDir } = options;

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

				// Only rename files if a non-standard extension is requested
				if (extension !== '.d.ts') {
					await execa('find', [
						outDir,
						'-name',
						'*.d.ts',
						'-exec',
						'sh',
						'-c',
						`for f do mv "$f" "\${f%.d.ts}${extension}"; done`,
						'_',
						'{}',
						'+'
					]);
					console.log(pc.green(`✓ TypeScript declarations generated with ${extension} extension`));
				} else {
					console.log(pc.green('✓ TypeScript declarations generated'));
				}
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
	 * Path to tsconfig.json file
	 * @default 'tsconfig.json'
	 */
	tsConfigPath?: string;

	/**
	 * Extension for declaration files
	 * @default '.d.ts'
	 */
	extension?: '.d.ts' | '.d.mts' | '.d.cts';

	/**
	 * Output directory for type declarations
	 * @default './dist/types'
	 */
	outDir?: string;
}
