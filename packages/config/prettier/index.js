/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
module.exports = {
	// Editor Config Overrides
	// These settings can be overridden by EditorConfig, so we define them explicitly
	// https://github.com/prettier/prettier/blob/main/docs/configuration.md#editorconfig
	endOfLine: 'lf',
	tabWidth: 2,
	useTabs: true,
	printWidth: 100,

	// Code Style
	singleQuote: true,
	trailingComma: 'none',
	semi: true,
	quoteProps: 'consistent',
	bracketSameLine: false,
	// Markdown is published documentation. Spaces keep code fences readable on npm and GitHub.
	overrides: [
		{
			files: ['*.md', '*.mdx'],
			options: {
				useTabs: false,
				tabWidth: 2
			}
		}
	],

	// Plugins
	// Note: Use require.resolve() to ensure plugins are found from this package's node_modules.
	// Without this, Prettier tries to resolve plugins from where Prettier runs (usually the root),
	// which fails when plugins are only installed as dependencies of this config package.
	plugins: [
		require.resolve('@ianvs/prettier-plugin-sort-imports'),
		require.resolve('prettier-plugin-tailwindcss'),
		require.resolve('prettier-plugin-css-order'),
		require.resolve('prettier-plugin-packagejson')
	],

	// prettier-plugin-tailwindcss configuration
	// https://github.com/tailwindlabs/prettier-plugin-tailwindcss
	tailwindFunctions: ['clsx', 'cn', 'cva'],

	// prettier-plugin-sort-imports configuration
	// https://github.com/IanVS/prettier-plugin-sort-imports
	importOrder: [
		// External packages
		'<THIRD_PARTY_MODULES>',
		// Internal packages
		'^@/',
		// Relative imports
		'^[../]',
		'^[./]'
	],
	importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
	importOrderTypeScriptVersion: '6.0.3'
};
