const js = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');
const globals = require('globals');
const onlyWarn = require('eslint-plugin-only-warn');
const turboPlugin = require('eslint-plugin-turbo');
const { globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');

/**
 * Base ESLint configuration.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	js.configs.recommended,
	eslintConfigPrettier,
	...tseslint.configs.recommended,
	...tseslint.configs.strict,
	{
		plugins: {
			turbo: turboPlugin
		},
		rules: {
			'turbo/no-undeclared-env-vars': 'warn'
		}
	},
	{
		plugins: {
			onlyWarn
		}
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ ignoreRestSiblings: true, varsIgnorePattern: '^_', argsIgnorePattern: '^_' }
			]
		}
	},
	// Tooling config files run in Node and may intentionally use CommonJS
	{
		files: ['*.config.js', '*.config.cjs'],
		languageOptions: {
			globals: globals.node
		},
		rules: {
			'@typescript-eslint/no-require-imports': 'off'
		}
	},
	globalIgnores(
		['**/dist/', '**/gen/', 'node_modules/', '.turbo/', 'eslint.config.*', '**/*.gen.ts'],
		'Ignore generated files'
	)
];
