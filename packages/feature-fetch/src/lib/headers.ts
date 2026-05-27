import type { TFetchHeaderPrimitive, TFetchHeadersInit, TResolvedFetchHeaders } from '../types';

/** Converts one header input into the normalized record shape. */
export function normalizeHeaders(headersInit?: TFetchHeadersInit): TResolvedFetchHeaders {
	// Note: Header names are dynamic, so avoid Object.prototype keys like toString
	const headers = Object.create(null) as TResolvedFetchHeaders;
	applyHeaders(headers, headersInit);
	return headers;
}

/**
 * Merges header inputs from left to right.
 * Later values override, tuple repeats append, record `null` removes, and `undefined` is ignored.
 */
export function mergeHeaders(
	...headersList: Array<TFetchHeadersInit | undefined>
): TResolvedFetchHeaders {
	// Note: Header names are dynamic, so avoid Object.prototype keys like toString
	const headers = Object.create(null) as TResolvedFetchHeaders;

	for (const headersInit of headersList) {
		applyHeaders(headers, headersInit);
	}

	return headers;
}

/** Returns a normalized header value, or null when the header is absent. */
export function getHeader(headers: TResolvedFetchHeaders, name: string): string | null {
	const key = normalizeHeaderName(name);
	return Object.hasOwn(headers, key) ? (headers[key] ?? null) : null;
}

/** Returns whether a normalized header record contains the given header name. */
export function hasHeader(headers: TResolvedFetchHeaders, name: string): boolean {
	return Object.hasOwn(headers, normalizeHeaderName(name));
}

/** Sets a header value after normalizing its name and value. */
export function setHeader(
	headers: TResolvedFetchHeaders,
	name: string,
	value: TFetchHeaderPrimitive
): void {
	headers[normalizeHeaderName(name)] = normalizeHeaderValue(value);
}

/** Removes a header after normalizing its name. */
export function deleteHeader(headers: TResolvedFetchHeaders, name: string): void {
	// eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Header names are normalized dynamic keys
	delete headers[normalizeHeaderName(name)];
}

function applyHeaders(headers: TResolvedFetchHeaders, headersInit?: TFetchHeadersInit): void {
	if (headersInit == null) {
		return;
	}

	// Tuple inputs append repeated names, matching Headers constructor behavior
	if (Array.isArray(headersInit)) {
		for (const [name, value] of headersInit) {
			const key = normalizeHeaderName(name);
			const normalizedValue = normalizeHeaderValue(value);
			headers[key] = headers[key] == null ? normalizedValue : `${headers[key]}, ${normalizedValue}`;
		}
		return;
	}

	// Headers-like inputs are already flattened by their own implementation
	if (isHeadersLike(headersInit)) {
		headersInit.forEach((value, name) => {
			setHeader(headers, name, value);
		});
		return;
	}

	// Record inputs replace values and use null as an explicit delete signal
	for (const [name, value] of Object.entries(headersInit)) {
		if (value === null) {
			deleteHeader(headers, name);
			continue;
		}

		if (value === undefined) {
			continue;
		}

		if (Array.isArray(value)) {
			if (value.length > 0) {
				setHeader(headers, name, value.map(normalizeHeaderValue).join(', '));
			}
			continue;
		}

		setHeader(headers, name, value);
	}
}

function normalizeHeaderName(name: string): string {
	return name.toLowerCase().trim();
}

function normalizeHeaderValue(value: TFetchHeaderPrimitive): string {
	return String(value).trim();
}

// Note: Avoids instanceof Headers so compatible inputs work when native Headers is unavailable
function isHeadersLike(value: unknown): value is THeadersLike {
	return (
		typeof value === 'object' &&
		value != null &&
		'forEach' in value &&
		typeof value.forEach === 'function'
	);
}

interface THeadersLike {
	forEach(callback: (value: string, key: string) => void): void;
}
