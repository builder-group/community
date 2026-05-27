const { defineConfig } = require('eslint/config');

/**
 * ESLint configuration for TypeScript libraries.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config[]}
 */
module.exports = defineConfig([...require('./base.js')]);
