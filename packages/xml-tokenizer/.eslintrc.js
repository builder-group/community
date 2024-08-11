const OFF = 0;
const WARNING = 1;
const ERROR = 2;

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
	root: true,
	extends: [require.resolve('@blgc/config/eslint/library')],
	rules: {
		'no-bitwise': OFF,
		'@typescript-eslint/prefer-literal-enum-member': OFF
	}
};
