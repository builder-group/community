const OFF = 0;
const WARNING = 1;
const ERROR = 2;

/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	...require('@blgc/style-guide/eslint/library'),
	{
		rules: {
			'no-bitwise': OFF,
			'@typescript-eslint/prefer-literal-enum-member': OFF
		}
	}
];
