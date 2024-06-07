import type { Result } from 'ts-results-es';

import type { NetworkException, RequestException, ServiceException } from '../exceptions';
import type { FetchHeaders } from '../helper';
import type { TParseAs, TRequestMethod } from './api';
import type { TFeatureKeys, TSelectFeatures } from './features';

export type TFetchClient<
	GSelectedFeatureKeys extends TFeatureKeys[],
	GPaths extends object = object
> = {
	_features: string[];
	_config: TFetchClientConfig;
	_fetchLike: TFetchLike;
	_baseFetch: <
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
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

export type TFetchLike = (url: URL | string, init?: RequestInit) => ReturnType<typeof fetch>;

export interface TFetchClientConfig {
	prefixUrl: string;
	pathSerializer: TPathSerializer;
	querySerializer: TQuerySerializer;
	bodySerializer: TBodySerializer;
	fetchProps: Omit<RequestInit, 'body' | 'method' | 'headers'>;
	headers: FetchHeaders;
	beforeRequestMiddlewares: TBeforeRequestMiddleware[];
	requestMiddlewares: TRequestMiddleware[];
}

export type TFetchClientOptions = Partial<Omit<TFetchClientConfig, 'headers' | 'middlewares'>> & {
	headers?: RequestInit['headers'] | FetchHeaders;
	fetch?: TFetchLike;
};

// ============================================================================
// Serializer Methods
// ============================================================================

export type TPathSerializer<GPathParams extends Record<string, unknown> = Record<string, unknown>> =
	(path: string, params: GPathParams) => string;

export type TQuerySerializer<
	GQueryParams extends Record<string, unknown> = Record<string, unknown>
> = (params: GQueryParams) => string;

export type TBodySerializer<GBody = unknown, GResult extends TSerializedBody = TSerializedBody> = (
	body: GBody,
	contentType?: string
) => GResult;

// ============================================================================
// Middleware
// ============================================================================

export type TRequestMiddleware = (next: TFetchLike) => TFetchLike;

export type TBeforeRequestMiddleware = (
	data: {
		props: unknown;
	} & TBeforeRequestMiddlewareData
) => Promise<Partial<TBeforeRequestMiddlewareData>>;

export interface TBeforeRequestMiddlewareData {
	requestInit: RequestInit;
	pathParams?: TPathParams;
	queryParams?: TQueryParams;
}

export type TPathParams = Record<string, unknown>;
export type TQueryParams = Record<string, unknown>;

export type TSerializedBody = RequestInit['body'];
export type TUnserializedBody = TSerializedBody | Record<string, unknown>;

// =============================================================================
// Fetch Options
// =============================================================================

export interface TFetchOptions<GParseAs extends TParseAs> {
	parseAs?: GParseAs | TParseAs; // '| TParseAs' to fix VsCode autocomplete
	headers?: RequestInit['headers'];
	prefixUrl?: string;
	fetchProps?: Omit<RequestInit, 'body' | 'method' | 'headers'>;
	middlewareProps?: unknown;
	pathParams?: TPathParams;
	queryParams?: TQueryParams;
	pathSerializer?: TPathSerializer;
	querySerializer?: TQuerySerializer;
	bodySerializer?: TBodySerializer;
}

export type TFetchOptionsWithBody<GParseAs extends TParseAs> = {
	body?: TUnserializedBody; // TODO: Only if POST or PUT
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
