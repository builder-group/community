const { defineConfig, mergeConfig } = require('vitest/config');
const { nodeConfig } = require('@ibg/config/vite/node.config');

module.exports = mergeConfig(nodeConfig, defineConfig({}));
