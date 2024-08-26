export const gql = (strings: TemplateStringsArray): string => {
	return strings.raw[0] ?? '';
};
