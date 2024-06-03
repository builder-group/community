import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import nodeExternals from 'rollup-plugin-node-externals';

import { isExternal } from '../../../../utils';
import type { TBaseDynRollupOptions, TDynRollupOptionsCallbackConfig } from '../../../dyn';
import { bundleSize, typescriptPaths } from '../../plugins';

export async function createBaseRollupConfig(
	config: TDynRollupOptionsCallbackConfig
): Promise<TBaseDynRollupOptions> {
	const { packageJson, paths, output, command, tsConfigPath, isProduction } = config;

	return {
		input: paths.input,
		output,
		plugins: [
			// Automatically declares NodeJS built-in modules like (node:path, node:fs) as external.
			// This prevents Rollup from trying to bundle these built-in modules,
			// which can cause unresolved dependencies warnings.
			nodeExternals(),
			// Convert CommonJS modules (from node_modules) into ES modules targeted by this app
			commonjs(),
			// Automatically resolve path aliases set in the compilerOptions section of tsconfig.json
			typescriptPaths(command, {
				tsConfigPath,
				shouldResolveRelativeToImporter: false,
				resolveDTsSource: true
			}),
			'import-css', // Plugin placeholder for "rollup-plugin-import-css"
			'wasm', // Plugin placeholder for "rollup-plugin-wasm"
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
			// license(/* */), Note: Not checking for third party licenses here as packages not included in bundle can't be detected (// https://github.com/mjeanroy/rollup-plugin-license/issues/440)
			'preserve-directives',
			'copy', // Plugin placeholder for "rollup-plugin-copy"
			await bundleSize(command)
		],
		// Exclude peer dependencies and dependencies from bundle for these reasons:
		// 1. To prevent duplication: If every package included a copy of all its dependencies,
		//    there would be a lot of duplication in node_modules.
		// 2. To enable better versioning: This way, npm can handle installing the latest compatible version.
		// 3. For improved security: If a security vulnerability is found in a dependency,
		//    npm can update it without needing to update this package.
		// 4. Auto Installation: Package managers automatically install these dependencies, so no need to bundle them.
		external: isExternal(packageJson, {
			fileTypesAsExternal: [],
			packageJsonDepsAsExternal: true
		})
	};
}
