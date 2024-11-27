import { nodeConfig } from '@blgc/style-guide/vite/library';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, defineConfig({}));
