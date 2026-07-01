import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: ['apps/*/vitest.config.mjs', 'packages/*/vitest.config.mjs']
	}
});
