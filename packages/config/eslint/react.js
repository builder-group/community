const pluginReactHooks = require('eslint-plugin-react-hooks');
const { defineConfig } = require('eslint/config');
const globals = require('globals');
const { createJiti } = require('jiti');

// Note: jiti loads the ESM-only @eslint-react/eslint-plugin from this CommonJS preset
const jiti = createJiti(__filename, { interopDefault: true });
const eslintReact = jiti('@eslint-react/eslint-plugin');

/**
 * ESLint configuration for applications and libraries that use React.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config[]}
 */
module.exports = defineConfig([
	...require('./base.js'),
	eslintReact.configs['recommended-typescript'],
	{
		name: '@blgc/config/react/globals',
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true
				}
			},
			globals: {
				...globals.browser
			}
		}
	},
	{
		name: '@blgc/config/react/hooks',
		plugins: {
			'react-hooks': pluginReactHooks
		},
		rules: {
			...pluginReactHooks.configs.recommended.rules
		}
	},
	{
		name: '@blgc/config/react/rule-overrides',
		rules: {
			'@eslint-react/dom-no-unknown-property': 'error',
			// Note: eslint-plugin-react-hooks owns hook diagnostics to avoid duplicate reports
			'@eslint-react/exhaustive-deps': 'off',
			'@eslint-react/rules-of-hooks': 'off'
		}
	}
]);
