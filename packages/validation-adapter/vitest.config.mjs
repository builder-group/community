import { defineConfig, mergeConfig } from 'vitest/config';
import { nodeConfig } from '@blgc/config/vite/node.config';

export default mergeConfig(nodeConfig, defineConfig({}));
