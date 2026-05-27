import { nodeConfig } from '@blgc/config/vitest/node';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, defineConfig({}));
