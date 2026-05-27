const pluginNext = require('@next/eslint-plugin-next');
const pluginReactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');
const { createJiti } = require('jiti');

// Load the ESM-only React plugin from CommonJS
const jiti = createJiti(__filename, { interopDefault: true });
const eslintReact = jiti('@eslint-react/eslint-plugin');

/**
 * ESLint configuration for applications that use Next.js.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	...require('./base.js'),
	{
		...eslintReact.configs['recommended-typescript'],
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true
				}
			},
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
		rules: {
			...pluginReactHooks.configs.recommended.rules
		}
	}
];
