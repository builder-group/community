import type { Result } from 'ts-results-es';

import type { NetworkException, RequestException, ServiceException } from '../exceptions';
import type { FetchHeaders } from '../utils';
import type { TParseAs, TRequestMethod } from './api';
import type { TFeatureKeys, TSelectFeatures } from './features';

export type TFetchClient<GSelectedFeatureKeys extends TFeatureKeys[], GPaths extends {} = {}> = {
	_features: string[];
	_config: TFetchClientConfig;
	_baseFetch: <
		GSuccessResponseBody = any,
		GErrorResponseBody = any,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		method: TRequestMethod,
		options: TFetchOptionsWithBody<GParseAs>
	) => Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;
} & TSelectFeatures<GSelectedFeatureKeys, GPaths>;

// =============================================================================
// Fetch Client Options & Config
// =============================================================================

export interface TBaseFetchClientConfig {
	prefixUrl: string;
	querySerializer: TQuerySerializer;
	bodySerializer: TBodySerializer;
	fetchProps: Omit<RequestInit, 'body' | 'method' | 'headers'>;
}

export type TFetchClientConfig = {
	headers: FetchHeaders;
	middleware: TRequestMiddleware[];
} & TBaseFetchClientConfig;

export type TFetchClientOptions = Partial<TFetchClientConfig> & {
	headers?: RequestInit['headers'];
	middleware?: TRequestMiddleware | TRequestMiddleware[];
};

// ============================================================================
// Serializer Methods
// ============================================================================

export type TQuerySerializer<
	GQueryParams extends Record<string, unknown> = Record<string, unknown>
> = (query: GQueryParams) => string;

export type TBodySerializer<
	GBody = any,
	GResult extends RequestInit['body'] = RequestInit['body']
> = (body: GBody, contentType?: string) => GResult;

// ============================================================================
// Middleware
// ============================================================================

export type TRequestMiddleware = (
	data: {
		props: unknown;
	} & TRequestMiddlewareData
) => Promise<Partial<TRequestMiddlewareData>>;

export interface TRequestMiddlewareData {
	requestInit: RequestInit;
	queryParams: TURLParams['query'];
	pathParams: TURLParams['path'];
}

export interface TURLParams {
	query?: Record<string, unknown> | null;
	path?: Record<string, unknown> | null;
}

// =============================================================================
// Fetch Options
// =============================================================================

export interface TBaseFetchOptions<GParseAs extends TParseAs> {
	parseAs?: GParseAs | TParseAs; // '| TParseAs' to fix VsCode autocomplete
	headers?: RequestInit['headers'];
	pathPrefix?: string;
	fetchProps?: Omit<RequestInit, 'body' | 'method'>;
	middlewareProps?: unknown;
}

export type TFetchOptions<GParseAs extends TParseAs> = {
	queryParams?: TURLParams['query'];
	pathParams?: TURLParams['path'];
	querySerializer?: TQuerySerializer;
	bodySerializer?: TBodySerializer;
} & TBaseFetchOptions<GParseAs>;

export type TFetchOptionsWithBody<GParseAs extends TParseAs> = {
	body?: RequestInit['body']; // TODO: Only if POST or PUT
} & TFetchOptions<GParseAs>;

// =============================================================================
// Fetch Response
// =============================================================================

export type TResponseBodyWithParseAs<
	GResponseBody,
	GParseAs extends TParseAs
> = GParseAs extends 'json'
	? GResponseBody
	: GParseAs extends 'text'
	? Awaited<ReturnType<Response['text']>>
	: GParseAs extends 'blob'
	? Awaited<ReturnType<Response['blob']>>
	: GParseAs extends 'arrayBuffer'
	? Awaited<ReturnType<Response['arrayBuffer']>>
	: GParseAs extends 'stream'
	? Response['body']
	: never;

export interface TFetchResponseSuccess<GSuccessResponseBody, GParseAs extends TParseAs> {
	data: TResponseBodyWithParseAs<GSuccessResponseBody, GParseAs>;
	response: Response;
}

export type TFetchResponseError<GErrorResponseBody = unknown> =
	| NetworkException
	| RequestException<GErrorResponseBody>
	| ServiceException;

export type TFetchResponse<
	GSuccessResponseBody,
	GErrorResponseBody,
	GParseAs extends TParseAs
> = Result<
	TFetchResponseSuccess<GSuccessResponseBody, GParseAs>,
	TFetchResponseError<GErrorResponseBody>
>;
