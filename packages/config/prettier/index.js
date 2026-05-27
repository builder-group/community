/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
module.exports = {
	// EditorConfig overrides
	// https://github.com/prettier/prettier/blob/main/docs/configuration.md#editorconfig
	endOfLine: 'lf',
	tabWidth: 2,
	useTabs: true,
	printWidth: 100,

	// Code style
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
	// Note: Resolve plugin paths from this package so consumers do not need to install them directly
	plugins: [
		require.resolve('@ianvs/prettier-plugin-sort-imports'),
		require.resolve('prettier-plugin-css-order'),
		require.resolve('prettier-plugin-packagejson'),
		// Note: Tailwind must be loaded last to compose with other Prettier plugins
		// https://github.com/tailwindlabs/prettier-plugin-tailwindcss#compatibility-with-other-prettier-plugins
		require.resolve('prettier-plugin-tailwindcss')
	],

	// Tailwind class sorting
	// https://github.com/tailwindlabs/prettier-plugin-tailwindcss
	tailwindFunctions: ['clsx', 'cn', 'cva'],

	// Import sorting
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
	importOrderTypeScriptVersion: '6.0.0'
};
