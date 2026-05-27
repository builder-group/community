import type { TPathParams, TPathSerializer, TQueryParams, TQuerySerializer } from '../types';

/** Builds a request URL from a base URL, path params, and query params. Absolute paths ignore the base URL. */
export function buildUrl(baseUrl: string, config: TBuildUrlConfig): string {
	const { path = '', pathParams = {}, queryParams = {}, pathSerializer, querySerializer } = config;
	const url = joinUrl(baseUrl, path);
	const urlWithPathParams = pathSerializer(url, pathParams);
	const queryString = removeLeadingQuestionMark(querySerializer(queryParams));
	return appendQueryString(urlWithPathParams, queryString);
}

interface TBuildUrlConfig {
	path?: string;
	pathParams?: TPathParams;
	queryParams?: TQueryParams;
	querySerializer: TQuerySerializer;
	pathSerializer: TPathSerializer;
}

function joinUrl(baseUrl: string, path: string): string {
	if (!baseUrl.length || isAbsoluteUrl(path)) {
		return path;
	}
	if (!path.length) {
		return removeTrailingSlash(baseUrl);
	}

	return `${removeTrailingSlash(baseUrl)}/${removeLeadingSlash(path)}`;
}

function isAbsoluteUrl(url: string): boolean {
	// Match URL schemes like http:, data:, and blob: without validating the full URL
	return /^[a-z][a-z\d+\-.]*:/i.test(url);
}

function removeTrailingSlash(baseUrl: string): string {
	return baseUrl.replace(/\/$/, '');
}

function removeLeadingSlash(url: string): string {
	return url.replace(/^\//, '');
}

function appendQueryString(url: string, queryString: string): string {
	if (!queryString.length) {
		return url;
	}

	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}${queryString}`;
}

function removeLeadingQuestionMark(url: string): string {
	return url.replace(/^\?/, '');
}
