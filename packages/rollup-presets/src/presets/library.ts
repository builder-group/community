import commonjs from '@rollup/plugin-commonjs';
import pc from 'picocolors';
import type { RollupOptions } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import nodeExternals from 'rollup-plugin-node-externals';
import { PackageJson } from 'type-fest';
import {
	createRollupCjsOutputConfig,
	createRollupDtsConfig,
	createRollupEsmOutputConfig,
	createRollupExternalConfig,
	getPkgJsonPath,
	getTsConfigPath,
	readJsonFile,
	resolvePkgJsonBundlePaths
} from '../lib';
import { typescriptPathsPlugin } from '../plugins';

/**
 * Creates a library build configuration for rollup.
 * Supports both ESM and CJS output formats with TypeScript path resolution.
 */
export async function libraryPreset(config: TLibraryPresetConfig): Promise<RollupOptions[]> {
	const { isProduction = true, preserveModules = true, sourcemap = true } = config;
	const rollupOptions: RollupOptions[] = [];

	// Read and validate package.json
	const packageJson = await readPackageJson();
	console.log(`--------------------------------`);
	console.log(`Rollup Preset: ${pc.yellowBright('Library')}`);
	console.log(`Package: ${pc.greenBright(packageJson.name)}`);
	console.log(`Environment: ${pc.blueBright(isProduction ? 'Production' : 'Development')}`);
	console.log(`--------------------------------`);

	// Get tsconfig path
	const tsConfigPath = getTsConfigPath(isProduction ? ['prod', null] : [null]);
	if (tsConfigPath == null) {
		console.log(`No tsconfig.json file found at ${pc.underline(process.cwd())}`);
		process.exit(1);
	}

	// Get bundle paths for both ESM and CJS formats
	const bundlePaths = [
		...resolvePkgJsonBundlePaths(packageJson, {
			format: 'esm',
			preserveModules,
			resolvePath: true
		}).map((bundlePath) => ({
			...bundlePath,
			format: 'esm'
		})),
		...resolvePkgJsonBundlePaths(packageJson, {
			format: 'cjs',
			preserveModules,
			resolvePath: true
		}).map((bundlePath) => ({
			...bundlePath,
			format: 'cjs'
		}))
	];

	// Create a Rollup config for each bundle path
	rollupOptions.push(
		...bundlePaths.map((bundlePath) => {
			const { input: inputPath, output: outputPath, format } = bundlePath;

			return {
				input: inputPath,
				output:
					format === 'esm'
						? createRollupEsmOutputConfig({
								outputPath,
								outputOptions: {
									name: packageJson.name,
									preserveModules,
									sourcemap
								}
							})
						: createRollupCjsOutputConfig({
								outputPath,
								outputOptions: {
									name: packageJson.name,
									preserveModules,
									sourcemap
								}
							}),
				plugins: [
					// Automatically declares NodeJS built-in modules like (node:path, node:fs) as external.
					// This prevents Rollup from trying to bundle these built-in modules,
					// which can cause unresolved dependencies warnings.
					nodeExternals(),
					// Convert CommonJS modules (from node_modules) into ES modules targeted by this app
					commonjs(),
					// Automatically resolve path aliases set in the compilerOptions section of tsconfig.json
					typescriptPathsPlugin({
						tsConfigPath,
						shouldResolveRelativeToImporter: false,
						resolveDTsSource: true
					}),
					// Transpile TypeScript code to JavaScript (ES6), and minify in production
					esbuild({
						tsconfig: tsConfigPath,
						minify: isProduction,
						target: 'es6',
						exclude: [/node_modules/],
						loaders: {
							'.json': 'json' // Requires @rollup/plugin-commonjs
						},
						sourceMap: false // Configured in rollup 'output' object
					})
				],
				external: createRollupExternalConfig(packageJson, {
					fileTypesAsExternal: [],
					pkgJsonDepsAsExternal: true
				})
			};
		})
	);

	// Create a Rollup config for generating TypeScript declaration files
	rollupOptions.push(
		createRollupDtsConfig(packageJson, {
			tsConfigPath,
			preserveModules
		})
	);

	return rollupOptions;
}

function readPackageJson(): Promise<PackageJson> {
	const packageJsonPath = getPkgJsonPath();
	if (packageJsonPath == null) {
		console.log(`No package.json file found at ${pc.underline(process.cwd())}`);
		process.exit(1);
	}

	return readJsonFile<PackageJson>(packageJsonPath).then((packageJson) => {
		if (packageJson == null) {
			console.log(`Invalid package.json file found at ${pc.underline(packageJsonPath)}`);
			process.exit(1);
		}
		return packageJson;
	});
}

export interface TLibraryPresetConfig {
	/**
	 * Whether to build for production (enables minification)
	 * @default true
	 */
	isProduction?: boolean;

	/**
	 * Whether to preserve the module structure in output
	 * @default true
	 */
	preserveModules?: boolean;

	/**
	 * Whether to generate source maps
	 * @default true
	 */
	sourcemap?: boolean;
}
