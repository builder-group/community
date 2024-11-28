 

// https://github.com/apollographql/graphql-tag/blob/main/src/index.ts
export function gql(literals: TemplateStringsArray, ...args: unknown[]): string {
	// If a single string is passed, return it as is
	if (literals.raw.length === 1) {
		return literals.raw[0] ?? '';
	}

	// Otherwise, interleave the strings with the interpolated values
	return literals.raw.reduce((result, string, i) => {
		result += string;
		if (i < args.length) {
			result += String(args[i]);
		}
		return result;
	}, '');
}
