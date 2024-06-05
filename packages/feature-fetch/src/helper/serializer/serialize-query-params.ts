// TODO: Support https://swagger.io/docs/specification/serialization/#query

export function serializeQueryParams(queryParams: Record<string, unknown> = {}): string {
	if (typeof URLSearchParams === 'function') {
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(queryParams)) {
			if (value != null) {
				searchParams.set(key, String(value));
			}
		}
		return searchParams.toString();
	}

	// Fallback for environments that do not support URLSearchParams
	return Object.entries(queryParams)
		.filter(([, value]) => value != null)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join('&');
}
