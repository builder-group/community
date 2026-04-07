import { defineConfig } from 'vitest/config';

const nodeConfig = defineConfig({
	resolve: {
		tsconfigPaths: true
	},
	test: {
		coverage: {
			reporter: ['text', 'json', 'html']
		}
	}
});

export { nodeConfig };
