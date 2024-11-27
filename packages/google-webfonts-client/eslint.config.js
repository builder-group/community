/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	...require('@blgc/style-guide/eslint/library'),
	{
		ignores: ['src/gen/*']
	}
];
