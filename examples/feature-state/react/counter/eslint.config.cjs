const reactRefresh = require('eslint-plugin-react-refresh');

/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config}
 */
module.exports = [
	...require('@blgc/config/eslint/react-internal'),
	{
		ignores: ['dist/', 'eslint.config.cjs'],
		plugins: {
			'react-refresh': reactRefresh
		},
		rules: {
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
		}
	}
];
