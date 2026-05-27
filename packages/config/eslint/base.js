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
		['**/dist/', '**/gen/', '**/.turbo/', '**/eslint.config.*', '**/*.gen.{ts,tsx}'],
		'@blgc/config/base/ignores'
	),
	{
		...eslintConfigPrettier,
		name: '@blgc/config/base/prettier'
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
		name: '@blgc/config/base/only-warn',
		plugins: {
			onlyWarn
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
	// Tooling config files run in Node and may intentionally use CommonJS
	{
		name: '@blgc/config/base/tooling-configs',
		files: ['**/*.config.{js,cjs,mjs,ts,cts,mts}'],
		languageOptions: {
			globals: globals.node
		},
		rules: {
			'@typescript-eslint/no-require-imports': 'off'
		}
	}
]);
