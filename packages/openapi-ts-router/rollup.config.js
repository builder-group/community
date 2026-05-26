const { libraryPreset } = require('rollup-presets');

/**
 * @type {import('rollup').RollupOptions[]}
 */
module.exports = libraryPreset({
	crossModuleImports: true,
	onCreateConfig(config, bundlePath) {
		// Strip adapter source folders so subpath exports resolve to dist/{adapter}/{format}/index.js
		if (bundlePath.input.endsWith('/src/express/index.ts')) {
			return {
				...config,
				output: {
					...config.output,
					preserveModulesRoot: 'src/express'
				}
			};
		}
		if (bundlePath.input.endsWith('/src/hono/index.ts')) {
			return {
				...config,
				output: {
					...config.output,
					preserveModulesRoot: 'src/hono'
				}
			};
		}

		return config;
	}
});
