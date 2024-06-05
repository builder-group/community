import type { TPathSerializer, TQuerySerializer, TUrlParams } from '../types';
import { serializePathParams, serializeQueryParams } from './serializer';

export function buildUrl(baseUrl: string, options: TBuildUrlOptions): string {
	const {
		path = '',
		params: { query: queryParams = {}, path: pathParams = {} } = {},
		querySerializer = serializeQueryParams,
		pathSerializer = serializePathParams
	} = options;
	const url = `${removeTrailingSlash(baseUrl)}${removeLeadingSlash(path)}`;
	const urlWithPathParams = pathSerializer(url, pathParams);
	return appendQueryParams(urlWithPathParams, querySerializer, queryParams);
}

interface TBuildUrlOptions {
	path?: string;
	params?: TUrlParams;
	querySerializer?: TQuerySerializer;
	pathSerializer?: TPathSerializer;
}

function appendQueryParams(
	path: string,
	querySerializer: TQuerySerializer,
	queryParams?: Record<string, unknown>
): string {
	if (queryParams != null) {
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
