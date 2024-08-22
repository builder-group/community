/*
 * This is a custom ESLint configuration for use with
 * Remix.js apps.
 *
 * This config extends the Vercel Engineering Style Guide.
 * For more information, see https://github.com/vercel/style-guide
 *
 * and is based on: https://github.com/remix-run/remix/blob/main/templates/remix/.eslintrc.cjs
 */

const OFF = 0;
const WARNING = 1;
const ERROR = 2;

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true
		}
	},
	env: {
		browser: true,
		commonjs: true,
		es6: true
	},
	ignorePatterns: ['!**/.server', '!**/.client'],
	extends: [
		// Note: Not using @remix-run/eslint-config because they are outdated and more or less deprecated (https://github.com/remix-run/remix/issues/7325)
		// require.resolve('@remix-run/eslint-config'),
		// require.resolve('@remix-run/eslint-config/node'),
		require.resolve('@vercel/style-guide/eslint/node'),
		require.resolve('@vercel/style-guide/eslint/browser'),
		require.resolve('@vercel/style-guide/eslint/react'),
		require.resolve('./_base')
	],
	globals: {
		React: true,
		JSX: true
	},
	// overrides: [
	// 	// React
	// 	{
	// 		files: ['**/*.{js,jsx,ts,tsx}'],
	// 		plugins: ['react', 'jsx-a11y'],
	// 		extends: [
	// 			'plugin:react/recommended',
	// 			'plugin:react/jsx-runtime',
	// 			'plugin:react-hooks/recommended',
	// 			'plugin:jsx-a11y/recommended'
	// 		],
	// 		settings: {
	// 			'react': {
	// 				version: 'detect'
	// 			},
	// 			'formComponents': ['Form'],
	// 			'linkComponents': [
	// 				{ name: 'Link', linkAttribute: 'to' },
	// 				{ name: 'NavLink', linkAttribute: 'to' }
	// 			],
	// 			'import/resolver': {
	// 				typescript: {}
	// 			}
	// 		}
	// 	},

	// 	// Typescript
	// 	{
	// 		files: ['**/*.{ts,tsx}'],
	// 		plugins: ['@typescript-eslint', 'import'],
	// 		parser: '@typescript-eslint/parser',
	// 		settings: {
	// 			'import/internal-regex': '^~/',
	// 			'import/resolver': {
	// 				node: {
	// 					extensions: ['.ts', '.tsx']
	// 				},
	// 				typescript: {
	// 					alwaysTryTypes: true
	// 				}
	// 			}
	// 		},
	// 		extends: [
	// 			'plugin:@typescript-eslint/recommended',
	// 			'plugin:import/recommended',
	// 			'plugin:import/typescript'
	// 		]
	// 	},

	// 	// Node
	// 	{
	// 		files: ['.eslintrc.cjs'],
	// 		env: {
	// 			node: true
	// 		}
	// 	}
	// ],
	rules: {
		// Typescript
		'@typescript-eslint/only-throw-error': OFF, // Often required in loader functions, ..

		// EsLint
		'import/no-default-export': OFF,

		// React
		'react/function-component-definition': [
			'error',
			{
				namedComponents: 'arrow-function'
			}
		]
	}
};
