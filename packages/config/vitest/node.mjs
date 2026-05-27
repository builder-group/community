import { defineConfig } from 'vitest/config';

const nodeConfig = defineConfig({
	resolve: {
		tsconfigPaths: true
	},
	test: {
		environment: 'node',
		coverage: {
			reporter: ['text', 'json', 'html']
		}
	}
});

export { nodeConfig };
export default nodeConfig;
