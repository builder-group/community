/**
 * @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig}
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

	// Plugins
	plugins: [
		'@ianvs/prettier-plugin-sort-imports',
		'prettier-plugin-tailwindcss',
		'prettier-plugin-packagejson'
	],

	// Import Sorting Configuration
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
	importOrderTypeScriptVersion: '5.2.2'
};
