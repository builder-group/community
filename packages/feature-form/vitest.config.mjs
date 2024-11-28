import { nodeConfig } from '@blgc/config/vite/node';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, defineConfig({}));
