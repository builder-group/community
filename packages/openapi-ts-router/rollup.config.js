const { libraryPreset } = require('rollup-presets');

/**
 * @type {import('rollup').RollupOptions[]}
 */
module.exports = libraryPreset({
	crossModuleImports: true,
	onCreateConfig(config, bundlePath) {
		// Note: Keep the package self-reference external so adapters reuse the root runtime.
		// Bundled copies create e.g. distinct error constructors, which break instanceof checks.
		const external = config.external;
		const nextConfig = {
			...config,
			external(source, importer, isResolved) {
				return (
					source === 'openapi-ts-router' ||
					(typeof external === 'function' && external(source, importer, isResolved))
				);
			}
		};

		// Strip adapter source folders so subpath exports resolve to dist/{adapter}/{format}/index.js
		if (bundlePath.input.endsWith('/src/express/index.ts')) {
			return {
				...nextConfig,
				output: {
					...nextConfig.output,
					preserveModulesRoot: 'src/express'
				}
			};
		}
		if (bundlePath.input.endsWith('/src/hono/index.ts')) {
			return {
				...nextConfig,
				output: {
					...nextConfig.output,
					preserveModulesRoot: 'src/hono'
				}
			};
		}

		return nextConfig;
	}
});
