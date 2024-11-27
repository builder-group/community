const { baseConfig } = require('./base.js');

/**
 * ESLint configuration for TypeScript libraries.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	...baseConfig,
	{
		rules: {}
	}
];
