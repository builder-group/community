const pluginReactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');
const { createJiti } = require('jiti');

// Load the ESM-only React plugin from CommonJS
const jiti = createJiti(__filename, { interopDefault: true });
const eslintReact = jiti('@eslint-react/eslint-plugin');

/**
 * ESLint configuration for applications and libraries that use ReactJs.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	...require('./base.js'),
	eslintReact.configs['recommended-typescript'],
	{
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true
				}
			},
			globals: {
				...cleanGlobals(globals.serviceworker),
				...cleanGlobals(globals.browser)
			}
		}
	},
	{
		plugins: {
			'react-hooks': pluginReactHooks
		},
		rules: {
			...pluginReactHooks.configs.recommended.rules,
			'@eslint-react/dom-no-unknown-property': ['error', { ignore: ['variant'] }]
		}
	}
];

/**
 * Clean globals object by trimming whitespace from keys.
 *
 * Fixes: Global "AudioWorkletGlobalScope " has leading or trailing whitespace.
 */
function cleanGlobals(globalsObj) {
	return Object.fromEntries(Object.entries(globalsObj).map(([key, value]) => [key.trim(), value]));
}
