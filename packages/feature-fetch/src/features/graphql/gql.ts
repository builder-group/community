/**
 * Interpolates a GraphQL template literal into a query string.
 * This keeps Apollo `graphql-tag`-style authoring without parsing or caching the document.
 * Template strings are kept as raw GraphQL source; escape sequences like `\n` are not processed.
 *
 * Note: This helper returns the source string directly instead of parsing it first,
 * so the raw text is what gets sent.
 *
 * Interpolated values are stringified; compose string fragments, not `DocumentNode` objects.
 *
 * @see https://github.com/apollographql/graphql-tag/blob/main/src/index.ts
 */
export function gql(literals: TemplateStringsArray, ...args: unknown[]): string {
	let result = '';

	for (let i = 0; i < literals.raw.length; i++) {
		result += literals.raw[i];
		if (i < args.length) {
			result += String(args[i]);
		}
	}

	return result;
}
