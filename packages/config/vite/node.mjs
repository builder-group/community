import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const nodeConfig = defineConfig({
	test: {
		coverage: {
			reporter: ['text', 'json', 'html']
		}
	},
	plugins: [tsconfigPaths()]
});

export { nodeConfig };
