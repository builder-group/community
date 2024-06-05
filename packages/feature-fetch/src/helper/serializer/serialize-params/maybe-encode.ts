export function maybeEncode(value: string | number | boolean, encode = true): string {
	return encode ? encodeURIComponent(value) : value.toString();
}
