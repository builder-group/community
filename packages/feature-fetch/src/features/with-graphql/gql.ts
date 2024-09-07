/* eslint-disable no-param-reassign -- Ok in reduce function */

export function gql(strings: TemplateStringsArray, ...values: unknown[]): string {
	// If a single string is passed, return it as is
	if (strings.raw.length === 1) {
		return strings.raw[0] ?? '';
	}

	// Otherwise, interleave the strings with the interpolated values
	return strings.raw.reduce((result, string, i) => {
		result += string;
		if (i < values.length) {
			result += String(values[i]);
		}
		return result;
	}, '');
}
