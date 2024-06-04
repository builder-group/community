export function isObject<GResponse extends Record<string, any> = Record<string, any>>(
	data: any
): data is GResponse {
	return data != null && typeof data === 'object';
}
