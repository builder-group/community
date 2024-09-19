import type { TPathParams, TPathSerializer, TQueryParams, TQuerySerializer } from '../types';

export function buildUrl(prefixUrl: string, options: TBuildUrlConfig): string {
	const { path = '', pathParams = {}, queryParams = {}, pathSerializer, querySerializer } = options;
	const url =
		prefixUrl.length > 0 ? `${removeTrailingSlash(prefixUrl)}/${removeLeadingSlash(path)}` : path;
	const urlWithPathParams = pathSerializer(url, pathParams);
	return appendQueryParams(urlWithPathParams, querySerializer, queryParams);
}

interface TBuildUrlConfig {
	path?: string;
	pathParams?: TPathParams;
	queryParams?: TQueryParams;
	querySerializer: TQuerySerializer;
	pathSerializer: TPathSerializer;
}

function appendQueryParams(
	path: string,
	querySerializer: TQuerySerializer,
	queryParams: Record<string, unknown>
): string {
	if (Object.keys(queryParams).length > 0) {
		const queryString = querySerializer(queryParams);
		return `${path}?${removeLeadingQuestionmark(queryString)}`;
	}
	return path;
}

function removeTrailingSlash(baseUrl: string): string {
	return baseUrl.replace(/\/$/, '');
}

function removeLeadingSlash(url: string): string {
	return url.replace(/^\//, '');
}

function removeLeadingQuestionmark(url: string): string {
	return url.replace(/^\?/, '');
}
