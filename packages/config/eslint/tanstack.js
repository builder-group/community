const { defineConfig, globalIgnores } = require('eslint/config');

/**
 * ESLint configuration for TanStack Router/Start applications.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config[]}
 */
module.exports = defineConfig([
	...require('./react.js'),
	globalIgnores(['**/.output/', '**/.tanstack/'], '@blgc/config/tanstack/ignores'),
	{
		name: '@blgc/config/tanstack/vite-env',
		// Note: Vite provides these built-ins, so Turbo should not require repo env declarations
		rules: {
			'turbo/no-undeclared-env-vars': [
				'warn',
				{
					allowList: ['^(DEV|PROD|MODE|BASE_URL|SSR)$']
				}
			]
		}
	}
]);
