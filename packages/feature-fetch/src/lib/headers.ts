import type { TFetchHeaderPrimitive, TFetchHeadersInit, TResolvedFetchHeaders } from '../types';

/** Converts one header input into the normalized record shape used by feature-fetch. */
export function normalizeHeaders(headersInit?: TFetchHeadersInit): TResolvedFetchHeaders {
	const headers: TResolvedFetchHeaders = {};
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
	const headers: TResolvedFetchHeaders = {};

	for (const headersInit of headersList) {
		applyHeaders(headers, headersInit);
	}

	return headers;
}

export function getHeader(headers: TResolvedFetchHeaders, name: string): string | null {
	return headers[normalizeHeaderName(name)] ?? null;
}

export function hasHeader(headers: TResolvedFetchHeaders, name: string): boolean {
	return normalizeHeaderName(name) in headers;
}

export function setHeader(
	headers: TResolvedFetchHeaders,
	name: string,
	value: TFetchHeaderPrimitive
): void {
	headers[normalizeHeaderName(name)] = normalizeHeaderValue(value);
}

export function deleteHeader(headers: TResolvedFetchHeaders, name: string): void {
	Reflect.deleteProperty(headers, normalizeHeaderName(name));
}

function applyHeaders(headers: TResolvedFetchHeaders, headersInit?: TFetchHeadersInit): void {
	if (headersInit == null) {
		return;
	}

	if (Array.isArray(headersInit)) {
		for (const [name, value] of headersInit) {
			appendHeader(headers, name, value);
		}
		return;
	}

	if (isHeadersLike(headersInit)) {
		headersInit.forEach((value, name) => {
			setHeader(headers, name, value);
		});
		return;
	}

	for (const [name, value] of Object.entries(headersInit)) {
		if (value === null) {
			deleteHeader(headers, name);
			continue;
		}

		if (value == null) {
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

function appendHeader(
	headers: TResolvedFetchHeaders,
	name: string,
	value: TFetchHeaderPrimitive
): void {
	const key = normalizeHeaderName(name);
	const normalizedValue = normalizeHeaderValue(value);
	headers[key] = headers[key] == null ? normalizedValue : `${headers[key]}, ${normalizedValue}`;
}

function normalizeHeaderName(name: string): string {
	return name.toLowerCase().trim();
}

function normalizeHeaderValue(value: TFetchHeaderPrimitive): string {
	return String(value).trim();
}

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
