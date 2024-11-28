import path from 'node:path';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import license from 'rollup-plugin-license';
import nodeExternals from 'rollup-plugin-node-externals';
import { getPathDetails, isExternal } from '../../../../utils';
import type { TBaseDynRollupOptions, TDynRollupOptionsCallbackConfig } from '../../../dyn';
import { bundleSize, typescriptPaths } from '../../plugins';

export async function createBaseRollupConfig(
	config: TDynRollupOptionsCallbackConfig & { bundleDeps: boolean }
): Promise<TBaseDynRollupOptions> {
	const { packageJson, paths, output, command, tsConfigPath, isProduction, bundleDeps } = config;
	const pathDetails = getPathDetails(paths.output);

	return {
		input: paths.input,
		output,
		plugins: [
			// Resolve and bundle dependencies from node_modules
			bundleDeps &&
				nodeResolve({
					extensions: ['.ts', '.tsx', '.js', '.jsx'],
					browser: false,
					preferBuiltins: true
				}),
			// Automatically declares NodeJS built-in modules like (node:path, node:fs) as external.
			// This prevents Rollup from trying to bundle these built-in modules,
			// which can cause unresolved dependencies warnings.
			!bundleDeps && nodeExternals(),
			// Convert CommonJS modules (e.g. from 'node_modules') into ES modules targeted by this app
			commonjs(),
			// Automatically resolve path aliases set in the compilerOptions section of tsconfig.json
			typescriptPaths(command, {
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
			}),
			// typescript(/* */), // Obsolete as esbuild takes care of configuring typescript
			// babel(/* */), // Obsolete as esbuild takes care of converting ES2015+ modules into compatible JavaScript files
			// terser(/* */), // Obsolete as esbuild takes care of minifying
			bundleDeps && json(), // Resolve JSON files from node_modules
			bundleDeps &&
				license({
					thirdParty: {
						output: {
							file: path.join(pathDetails.directory, `third-party-licenses.txt`),
							encoding: 'utf-8',
							template(dependencies) {
								return dependencies
									.map(
										(dependency) =>
											`${dependency.license?.toString() ?? '_'} -- ${dependency.name?.toString() ?? '_'}:${dependency.version?.toString() ?? '_'}`
									)
									.join('\n');
							}
						},
						allow: '(Apache-2.0 OR BSD-2-Clause OR BSD-3-Clause OR MIT OR 0BSD)'
					}
				}),
			'copy', // Plugin placeholder for "rollup-plugin-copy"
			await bundleSize(command)
		],
		external: bundleDeps
			? []
			: isExternal(packageJson, {
					fileTypesAsExternal: [],
					packageJsonDepsAsExternal: true
				})
	};
}
