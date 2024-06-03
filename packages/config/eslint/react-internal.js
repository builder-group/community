/*
 * This is a custom ESLint configuration for use with
 * internal (bundled by their consumer) libraries
 * that utilize React.
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
	extends: [
		require.resolve('@vercel/style-guide/eslint/browser'),
		require.resolve('@vercel/style-guide/eslint/react'),
		require.resolve('./_base')
	],
	globals: {
		React: true,
		JSX: true
	},
	rules: {
		// React
		'react/function-component-definition': [
			'error',
			{
				namedComponents: 'arrow-function'
			}
		]
	}
};
