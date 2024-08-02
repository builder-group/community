const { defineConfig, mergeConfig } = require('vitest/config');
const { nodeConfig } = require('@blgc/config/vite/node.config');

module.exports = mergeConfig(nodeConfig, defineConfig({}));
