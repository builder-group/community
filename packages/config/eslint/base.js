const js = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');
const globals = require('globals');
const onlyWarn = require('eslint-plugin-only-warn');
const turboPlugin = require('eslint-plugin-turbo');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');

/**
 * Base ESLint configuration.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config[]}
 */
module.exports = defineConfig([
	js.configs.recommended,
	...tseslint.configs.strict,
	globalIgnores(
		['**/.turbo/', '**/coverage/', '**/dist/', '**/gen/', '**/*.{gen,generated}.{js,jsx,ts,tsx}'],
		'@blgc/config/base/ignores'
	),
	{
		name: '@blgc/config/base/linter-options',
		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
			reportUnusedInlineConfigs: 'warn'
		}
	},
	{
		name: '@blgc/config/base/warning-mode',
		plugins: {
			onlyWarn
		}
	},
	{
		name: '@blgc/config/base/javascript-overrides',
		rules: {
			eqeqeq: ['error', 'always', { null: 'ignore' }]
		}
	},
	{
		name: '@blgc/config/base/turbo',
		plugins: {
			turbo: turboPlugin
		},
		rules: {
			'turbo/no-undeclared-env-vars': 'warn'
		}
	},
	{
		name: '@blgc/config/base/typescript-overrides',
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ ignoreRestSiblings: true, varsIgnorePattern: '^_', argsIgnorePattern: '^_' }
			]
		}
	},
	// Note: Tooling config files run in Node and may intentionally use CommonJS
	{
		name: '@blgc/config/base/tooling-configs',
		files: ['**/*.config.{js,cjs,mjs,ts,cts,mts}'],
		languageOptions: {
			globals: globals.node
		},
		rules: {
			'@typescript-eslint/no-require-imports': 'off'
		}
	},
	{
		...eslintConfigPrettier,
		name: '@blgc/config/base/prettier'
	}
]);
