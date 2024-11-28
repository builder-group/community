const js = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');
const onlyWarn = require('eslint-plugin-only-warn');
const turboPlugin = require('eslint-plugin-turbo');
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
		files: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx']
	}
];
