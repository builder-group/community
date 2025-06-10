const pluginReact = require('eslint-plugin-react');
const pluginReactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');

/**
 * ESLint configuration for applications and libraries that use ReactJs.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	...require('./base.js'),
	pluginReact.configs.flat.recommended,
	{
		languageOptions: {
			...pluginReact.configs.flat.recommended.languageOptions,
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
		settings: { react: { version: 'detect' } },
		rules: {
			...pluginReactHooks.configs.recommended.rules,
			'react/react-in-jsx-scope': 'off'
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
