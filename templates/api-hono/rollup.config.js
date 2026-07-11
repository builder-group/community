import { getPkgJson, libraryPreset } from 'rollup-presets';

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default async () => {
	const packageJson = await getPkgJson();
	if (packageJson == null) {
		throw new Error('Could not resolve package.json');
	}

	return libraryPreset({
		esbuildOptions: {
			define: {
				'process.env.npm_package_version': JSON.stringify(packageJson.version)
			}
		}
	});
};
