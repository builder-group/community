const { libraryPreset } = require('rollup-presets');

/**
 * @type {import('rollup').RollupOptions[]}
 */
module.exports = libraryPreset({
	isProduction: process.env.NODE_ENV === 'production',
	preserveModules: true,
	sourcemap: true
});
