import type { TBaseDynRollupOptions, TDynRollupOptionsCallbackConfig } from '../../../dyn';

export function createPluginRollupConfig(
	config: TDynRollupOptionsCallbackConfig
): TBaseDynRollupOptions {
	const { paths, output } = config;

	return {
		input: paths.input,
		output,
		plugins: [
			'node-resolve',
			'commonjs',
			'resolve-typescript-paths',
			'esbuild',
			'replace',
			'rollup-plugin-license',
			'rollup-plugin-bundle-size'
		],
		external: ['react', 'react-dom']
	};
}
