import path from 'node:path';
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
	createRollupVirtualConfig,
	getExeca,
	getPkgJson,
	getRollupPluginNodeExternals,
	getTsConfigPath,
	resolvePkgJsonBundlePaths
} from '../lib';
import { tsPathsPlugin } from '../plugins';

export async function libraryPreset(options: TLibraryPresetOptions = {}): Promise<RollupOptions[]> {
	const {
		environment = (process.env['NODE_ENV'] as TEnvironment) ?? 'development',
		preserveModules = true,
		sourcemap = environment === 'development',
		useTsc = true,
		formats = ['esm', 'cjs', 'types'],
		plugins: additionalPlugins = {},
		esbuildOptions = {},
		compilerOptions = {},
		onCreateConfig,
		debug = false
	} = options;

	const rollupOptions: RollupOptions[] = [];

	// Get package.json
	const pkgJson = await getPkgJson();
	if (pkgJson == null) {
		throw new Error(
			pc.red(`No or invalid package.json file found at ${pc.underline(process.cwd())}`)
		);
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
		throw new Error(pc.red(`No tsconfig.json file found at ${pc.underline(process.cwd())}`));
	}

	// Get bundle paths for specified formats
	const bundlePaths = formats.flatMap((format) =>
		resolvePkgJsonBundlePaths(pkgJson, {
			format,
			preserveModules,
			resolvePath: true
		})
	);

	if (debug) {
		console.log('\n');
		console.log(pc.dim(`Bundle paths: ${JSON.stringify(bundlePaths, null, 2)}`));
	}

	const { default: nodeExternals } = await getRollupPluginNodeExternals();

	// Create a Rollup config for each bundle path
	for (const bundlePath of bundlePaths) {
		switch (bundlePath.format) {
			case 'esm':
			case 'cjs': {
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
				rollupOptions.push(
					onCreateConfig != null ? onCreateConfig(baseConfig, bundlePath) : baseConfig
				);
				break;
			}
			case 'types': {
				if (useTsc) {
					if (debug) {
						console.log(
							pc.dim(
								`Skipping TypeScript declaration generation for ${path.relative(process.cwd(), bundlePath.input)} in favor of tsc`
							)
						);
					}
					break;
				}

				const baseConfig = createRollupDtsConfig({
					tsConfigPath,
					inputPath: bundlePath.input,
					outputPath: bundlePath.output,
					preserveModules,
					compilerOptions,
					extension: bundlePath.extension,
					debug
				});
				rollupOptions.push(
					onCreateConfig != null ? onCreateConfig(baseConfig, bundlePath) : baseConfig
				);
				break;
			}
			default:
			// do nothing
		}
	}

	// Generate Typescript declarations using the tsc CLI
	if (useTsc && formats.includes('types')) {
		rollupOptions.push(
			createRollupVirtualConfig({
				name: 'tsc',
				execute: async () => {
					const { execa } = await getExeca();
					await execa('tsc', ['--emitDeclarationOnly', '--project', tsConfigPath]);
					console.log(pc.green(`✓ TypeScript declarations generated using ${pc.underline('tsc')}`));
				}
			})
		);
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
	formats?: Array<'esm' | 'cjs' | 'types'>;

	/**
	 * Whether to use `tsc` CLI for generating type declarations instead of Rollup plugins.
	 *
	 * Recommended when `preserveModules` is `true`, especially for packages with multiple
	 * entry points and cross-imports, as Rollup plugins do not handle module preservation well.
	 *
	 * Our own attempt (`rollup-plugin-ts-declarations`) works more around Rollup than with it,
	 * is very barebone, and struggles with cross-imports, making `tsc` CLI a more reliable choice
	 * even though we need to run a CLI command from code.
	 *
	 * If `preserveModules` is `false`, this option is unnecessary.
	 *
	 * @example
	 * Consider a package structure like:
	 * ```
	 * src/
	 *   api/
	 *     index.ts    -> imports from ../shared
	 *   utils/
	 *     index.ts    -> imports from ../shared
	 *   shared/
	 *     index.ts
	 * ```
	 * With exports:
	 * ```json
	 * {
	 *   "exports": {
	 *     "./api": "./dist/api/index.js",
	 *     "./utils": "./dist/utils/index.js"
	 *   }
	 * }
	 * ```
	 * Here, useTsc: true ensures correct type generation with preserved module structure.
	 *
	 * @default true
	 */
	useTsc?: boolean;

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

	/**
	 * Whether to log debug information
	 * @default false
	 */
	debug?: boolean;
}

type TEnvironment = 'development' | 'production';
