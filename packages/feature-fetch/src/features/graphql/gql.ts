/**
 * Interpolates a GraphQL template literal into a query string.
 *
 * The helper does not parse or cache the document. Interpolated values are stringified,
 * so compose string fragments rather than `DocumentNode` objects.
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
