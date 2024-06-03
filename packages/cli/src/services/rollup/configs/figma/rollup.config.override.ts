import path from 'node:path';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import license from 'rollup-plugin-license';

import { getPathDetails, readDotenvFile } from '../../../../utils';
import type { TBaseDynRollupOptions, TDynRollupOptionsCallbackConfig } from '../../../dyn';
import { bundleSize, typescriptPaths } from '../../plugins';

export async function createOverrideRollupConfig(
	config: TDynBaseRollupOptionsCallbackConfig
): Promise<TBaseDynRollupOptions> {
	const { packageJson, paths, output, command, tsConfigPath, isProduction, isWatchMode, envPath } =
		config;
	const env = await readDotenvFile(envPath);
	const pathDetails = getPathDetails(paths.output);

	return {
		input: paths.input,
		output,
		plugins: [
			// Resolve and bundle dependencies from node_modules
			nodeResolve({
				extensions: ['.ts', '.tsx', '.js', '.jsx'],
				browser: true
			}),
			// Convert CommonJS modules (from node_modules) into ES modules targeted by this app
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
				loaders: {
					'.json': 'json', // Requires @rollup/plugin-commonjs
					'.js': 'jsx' // Enable JSX in .js files too
				},
				jsxFactory: 'React.createElement',
				jsxFragment: 'React.Fragment',
				sourceMap: false // Configured in rollup 'output' object
			}),
			// typescript(/* */), // Obsolete as esbuild takes care of configuring typescript
			// babel(/* */), // Obsolete as esbuild takes care of converting ES2015+ modules into compatible JavaScript files
			// terser(/* */), // Obsolete as esbuild takes care of minifying
			license({
				thirdParty: {
					output: {
						file: path.join(
							pathDetails.directory,
							`${pathDetails.fileName}-third-party-licenses.txt`
						),
						encoding: 'utf-8',
						template(dependencies) {
							return dependencies
								.map(
									(dependency) =>
										`${dependency.license} -- ${dependency.name}:${dependency.version}`
								)
								.join('\n');
						}
					},
					allow: '(Apache-2.0 OR BSD-2-Clause OR BSD-3-Clause OR MIT OR 0BSD)'
				}
			}),
			replace({
				'preventAssignment': true,
				// TODO: Find root cause, because 'react-dom' got already resolved by 'commonjs' plugin?
				//       Has something to do with react-query.
				'require("react-dom");': '',
				'process.env.npm_package_version': JSON.stringify(packageJson.version),
				'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
				'process.env.WATCH_MODE': isWatchMode
			}),
			replace({
				preventAssignment: true,
				...env
			}),
			await bundleSize(command)
		],
		external: []
	};
}

export type TDynBaseRollupOptionsCallbackConfig = TDynRollupOptionsCallbackConfig & {
	envPath: string;
	isWatchMode: boolean;
};
