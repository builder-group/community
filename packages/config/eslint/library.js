/*
 * This is a custom ESLint configuration for use with
 * Typescript packages.
 *
 * This config extends the Vercel Engineering Style Guide.
 * For more information, see https://github.com/vercel/style-guide
 */

const OFF = 0;
const WARNING = 1;
const ERROR = 2;

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
	extends: [require.resolve('@vercel/style-guide/eslint/node'), require.resolve('./_base')],
	rules: {
		// Add specific rules configurations here
	}
};
