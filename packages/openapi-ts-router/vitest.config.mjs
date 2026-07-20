import { fileURLToPath } from 'node:url';
import { nodeConfig } from '@blgc/config/vitest/node';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: [
				// Note: Resolve the package self-reference from source because clean test runs have no dist output
				{
					find: /^openapi-ts-router$/,
					replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url))
				}
			]
		}
	})
);
