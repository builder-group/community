import commonjs from '@rollup/plugin-commonjs';
import pc from 'picocolors';
import type { Plugin, RollupOptions } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import * as ts from 'typescript';
import {
	createRollupCjsOutputConfig,
	createRollupDtsConfig,
	createRollupEsmOutputConfig,
	createRollupExternalConfig,
	getPkgJson,
	getRollupPluginNodeExternals,
	getTsConfigPath,
	resolvePkgJsonBundlePaths,
	TBundlePath
} from '../lib';
import { tsPathsPlugin } from '../plugins';

export async function libraryPreset(options: TLibraryPresetOptions = {}): Promise<RollupOptions[]> {
	const {
		environment = (process.env['NODE_ENV'] as TEnvironment) ?? 'development',
		preserveModules = true,
		sourcemap = environment === 'development',
		formats = ['esm', 'cjs'],
		plugins: additionalPlugins = {},
		esbuildOptions = {},
		compilerOptions = {},
		onCreateConfig
	} = options;

	const rollupOptions: RollupOptions[] = [];

	// Get package.json
	const pkgJson = await getPkgJson();
	if (pkgJson == null) {
		console.log(`No or invalid package.json file found at ${pc.underline(process.cwd())}`);
		process.exit(1);
	}

	console.log(`--------------------------------`);
	console.log(`Rollup Preset: ${pc.yellowBright('Library')}`);
	console.log(`Package: ${pc.greenBright(pkgJson.name)}`);
	console.log(`Environment: ${pc.blueBright(environment)}`);
	console.log(`--------------------------------`);

	// Get tsconfig path
	const tsConfigPath = getTsConfigPath(
		environment === 'production' ? ['prod', null] : ['dev', null]
	);
	if (tsConfigPath == null) {
		console.log(`No tsconfig.json file found at ${pc.underline(process.cwd())}`);
		process.exit(1);
	}

	// Get bundle paths for specified formats
	const bundlePaths = formats.flatMap((format) =>
		resolvePkgJsonBundlePaths(pkgJson, {
			format,
			preserveModules,
			resolvePath: true
		})
	);

	const { default: nodeExternals } = await getRollupPluginNodeExternals();

	// Create a Rollup config for each bundle path
	rollupOptions.push(
		...bundlePaths.map((bundlePath) => {
			const { input: inputPath, output: outputPath, format, extension } = bundlePath;
			const baseConfig: RollupOptions = {
				input: inputPath,
				output:
					format === 'esm'
						? createRollupEsmOutputConfig({
								outputPath,
								extension,
								outputOptions: {
									name: pkgJson.name,
									preserveModules,
									sourcemap
								}
							})
						: createRollupCjsOutputConfig({
								outputPath,
								extension,
								outputOptions: {
									name: pkgJson.name,
									preserveModules,
									sourcemap
								}
							}),
				plugins: [
					// Stage 1: Pre-processing
					...(additionalPlugins.pre ?? []),

					// Marks Node.js built-in modules (node:*) as external to prevent bundling
					// and avoid unresolved dependency warnings
					nodeExternals(),

					// Transforms CommonJS modules from node_modules into ES modules for compatibility
					commonjs(),

					// Resolves TypeScript path aliases from tsconfig.json for proper module imports
					tsPathsPlugin({
						tsConfigPath,
						compilerOptions
					}),

					// Stage 3: Path-aware Transformations
					...(additionalPlugins.transform ?? []),

					// Handles TypeScript compilation, minification, and JSON imports
					// Uses esbuild for fast builds while maintaining compatibility
					esbuild({
						tsconfig: tsConfigPath,
						minify: environment === 'production',
						target: 'es6',
						exclude: [/node_modules/],
						loaders: {
							'.json': 'json' // Enables JSON imports via commonjs
						},
						sourceMap: false, // Handled by rollup output config
						...esbuildOptions
					}),

					// Stage 4: Post-processing
					...(additionalPlugins.post ?? [])
				],
				external: createRollupExternalConfig(pkgJson, {
					fileTypesAsExternal: [],
					pkgJsonDepsAsExternal: true
				})
			};
			return onCreateConfig != null ? onCreateConfig(baseConfig, bundlePath) : baseConfig;
		})
	);

	// Create Rollup configs for type declaration files
	const bundlePathsWithTypes = new Map<string, TBundlePath>();
	for (const bundlePath of bundlePaths) {
		if (bundlePath.types != null) {
			bundlePathsWithTypes.set(bundlePath.types, bundlePath);
		}
	}
	if (bundlePathsWithTypes.size > 0) {
		for (const [typesPath, bundlePath] of bundlePathsWithTypes) {
			rollupOptions.push(
				createRollupDtsConfig({
					tsConfigPath,
					inputPath: bundlePath.input,
					outputPath: typesPath,
					format: bundlePath.format,
					preserveModules,
					compilerOptions
				})
			);
		}
	}

	return rollupOptions;
}

export interface TLibraryPresetOptions {
	/**
	 * Build environment
	 * @default 'development'
	 */
	environment?: TEnvironment;

	/**
	 * Whether to preserve the module structure in output
	 * @default true
	 */
	preserveModules?: boolean;

	/**
	 * Whether to generate source maps
	 * @default true in development, false in production
	 */
	sourcemap?: boolean;

	/**
	 * Output formats to generate
	 * @default ['esm', 'cjs']
	 */
	formats?: Array<'esm' | 'cjs'>;

	/**
	 * Additional plugins for each build stage:
	 * - pre: Runs before any resolution (e.g., file replacements, virtual modules)
	 * - transform: Runs after TS paths resolved (e.g., css/asset imports)
	 * - post: Runs after bundling (e.g., bundle analysis, compression)
	 */
	plugins?: {
		pre?: Plugin[];
		transform?: Plugin[];
		post?: Plugin[];
	};

	/**
	 * Options to pass to the esbuild plugin
	 */
	esbuildOptions?: Record<string, unknown>;

	/**
	 * Additional compiler options to pass to the TypeScript compiler
	 */
	compilerOptions?: ts.CompilerOptions;

	/**
	 * Callback to modify the rollup config for each bundle
	 * @param config The base rollup config
	 * @param bundlePath The current bundle path being processed
	 */
	onCreateConfig?: (
		config: RollupOptions,
		bundlePath: { input: string; output: string; format: string }
	) => RollupOptions;
}

type TEnvironment = 'development' | 'production';
