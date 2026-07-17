import library from '@blgc/config/eslint/library';
import { globalIgnores } from 'eslint/config';

/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("eslint").Linter.Config[]}
 */
export default [
	...library,
	globalIgnores(['**/graphql-env.d.ts'], '@template/api-shopify-hono/ignores')
];
