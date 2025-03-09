import path from 'node:path';
import pc from 'picocolors';
import type { Plugin, RollupOptions } from 'rollup';
import type { PackageJson } from 'type-fest';
import { VIRTUAL_ENTRY_ID, virtualEntryPlugin } from '../../plugins';
import { getExeca } from '../cached-imports';
import { resolvePkgJsonBundlePaths } from '../path';

/**
 * Creates a rollup config for generating TypeScript declaration files.
 * Uses tsc to generate declarations and handles output paths based on package.json.
 */
export function createRollupDtsConfig(
	pkgJson: PackageJson,
	options: TRollupDtsConfig = {}
): RollupOptions {
	const { tsConfigPath = 'tsconfig.json', preserveModules = true } = options;

	// Get declaration file output paths from package.json
	const [dtsPath] = resolvePkgJsonBundlePaths(pkgJson, {
		format: 'types',
		preserveModules,
		resolvePath: true
	});
	if (dtsPath == null) {
		console.log('No types output path found in package.json');
		process.exit(1);
	}

	return {
		input: VIRTUAL_ENTRY_ID,
		logLevel: 'silent',
		plugins: [virtualEntryPlugin(), createGenerateDtsPlugin({ tsConfigPath })]
	};
}

function createGenerateDtsPlugin(options: { tsConfigPath: string }): Plugin {
	const { tsConfigPath } = options;

	return {
		name: 'generate-dts',
		async buildStart() {
			try {
				console.log(`Generating TypeScript declarations from ${pc.underline(tsConfigPath)}`);

				const { execa } = await getExeca();
				await execa('pnpm', [
					'tsc',
					'--emitDeclarationOnly',
					'--project',
					path.resolve(process.cwd(), tsConfigPath)
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
	 * Path to tsconfig.json file
	 * @default 'tsconfig.json'
	 */
	tsConfigPath?: string;

	/**
	 * Whether to preserve the module structure in output
	 * @default true
	 */
	preserveModules?: boolean;
}
