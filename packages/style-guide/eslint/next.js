const pluginNext = require('@next/eslint-plugin-next');
const pluginReact = require('eslint-plugin-react');
const pluginReactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');
const { baseConfig } = require('./base.js');

/**
 * ESLint configuration for applications that use Next.js.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	...baseConfig,
	{
		...pluginReact.configs.flat.recommended,
		languageOptions: {
			...pluginReact.configs.flat.recommended.languageOptions,
			globals: {
				...globals.serviceworker
			}
		}
	},
	{
		plugins: {
			'@next/next': pluginNext
		},
		rules: {
			...pluginNext.configs.recommended.rules,
			...pluginNext.configs['core-web-vitals'].rules
		}
	},
	{
		plugins: {
			'react-hooks': pluginReactHooks
		},
		settings: { react: { version: 'detect' } },
		rules: {
			...pluginReactHooks.configs.recommended.rules,
			'react/react-in-jsx-scope': 'off'
		}
	}
];
