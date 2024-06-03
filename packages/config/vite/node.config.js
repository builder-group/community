const { defineConfig } = require('vitest/config');

// https://github.com/aleclarson/vite-tsconfig-paths/issues/75
const tsconfigPaths = require('vite-tsconfig-paths').default;

const nodeConfig = defineConfig({
	test: {
		coverage: {
			reporter: ['text', 'json', 'html']
		}
	},
	plugins: [tsconfigPaths()]
});

module.exports = { nodeConfig };
