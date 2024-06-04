import type { TQuerySerializer, TURLParams } from '../../types';
import { serializeQueryParams } from '../serialize';

export function buildUrl(baseURL: string, options: TBuildURIOptions): string {
	const {
		path = '',
		params: { query: queryParams = {}, path: pathParams = {} } = {},
		querySerializer = serializeQueryParams
	} = options;
	const sanitizedBaseURL = sanitizeBaseURL(baseURL);
	const pathWithParams = injectPathParams(path, pathParams ?? undefined);
	const finalURL = appendQueryParams(
		`${sanitizedBaseURL}${pathWithParams}`,
		querySerializer,
		queryParams ?? undefined
	);
	return finalURL;
}

// Removes trailing slash from the base URL
function sanitizeBaseURL(baseUrl: string): string {
	return baseUrl.replace(/\/$/, '');
}

// Injects path parameters into the URL path
function injectPathParams(path: string, pathParams?: Record<string, unknown>): string {
	let pathWithParams = path;
	if (pathParams != null) {
		for (const [key, value] of Object.entries(pathParams)) {
			pathWithParams = pathWithParams.replace(`{${key}}`, encodeURIComponent(String(value)));
		}
	}
	return pathWithParams;
}

// Appends query parameters to the URL
function appendQueryParams(
	path: string,
	querySerializer: TQuerySerializer,
	queryParams?: Record<string, unknown>
): string {
	if (queryParams != null) {
		const queryString = querySerializer(queryParams);
		return `${path}?${queryString}`;
	}
	return path;
}

interface TBuildURIOptions {
	path?: `/${string}`;
	params?: TURLParams;
	querySerializer?: TQuerySerializer;
}
