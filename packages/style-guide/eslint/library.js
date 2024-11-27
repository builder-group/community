import { config as baseConfig } from './base.js';

/**
 * ESLint configuration for TypeScript libraries.
 *
 * @type {import("eslint").Linter.Config}
 */
export const libraryConfig = [
	...baseConfig,
	{
		rules: {}
	}
];
