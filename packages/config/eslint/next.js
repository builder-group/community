const pluginNext = require('@next/eslint-plugin-next');
const { defineConfig, globalIgnores } = require('eslint/config');

/**
 * ESLint configuration for applications that use Next.js.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config[]}
 */
module.exports = defineConfig([
	...require('./react.js'),
	globalIgnores(
		['**/.next/', '**/out/', '**/build/', 'next-env.d.ts'],
		'@blgc/config/next/ignores'
	),
	{
		name: '@blgc/config/next/core-web-vitals',
		plugins: {
			'@next/next': pluginNext
		},
		rules: {
			...pluginNext.configs.recommended.rules,
			...pluginNext.configs['core-web-vitals'].rules
		}
	}
]);
