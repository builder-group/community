import type { TAnyFeature, TFeatureHost } from 'feature-core';
import type { TResult } from 'tuple-result';
import type { FetchError, HttpError, NetworkError } from './errors';

// MARK: - Client

export type TFetchClient<GFeatures extends TAnyFeature[] = []> = TFeatureHost<
	TFetchClientBase,
	GFeatures
>;

/**
 * Core fetch client API used by feature installers.
 * Use this type when a feature only needs the base request method and configuration.
 */
export interface TFetchClientBase {
	/** @internal */
	_config: TFetchClientConfig;
	/** @internal */
	_fetchLike: TFetchLike;
	/** Low-level request method used by higher-level features. */
	request: TFetchRequest;
}

export type TFetchLike = (url: URL | string, init?: RequestInit) => Promise<Response>;

export interface TFetchClientConfig {
	baseUrl: string;
	pathSerializer: TPathSerializer;
	querySerializer: TQuerySerializer;
	bodySerializer: TBodySerializer;
	requestInit: TFetchRequestInit;
	headers: TResolvedFetchHeaders;
	prepareRequest: TPrepareRequestHook[];
	middleware: TFetchMiddleware[];
	prepareResponse: TPrepareResponseHook[];
}

export type TPrepareRequestHook = (cx: TPrepareRequestContext) => void | Promise<void>;

/** Mutable request context passed to `prepareRequest` hooks before URL/body creation. */
export interface TPrepareRequestContext {
	/** HTTP method before final uppercasing. */
	method: TRequestMethod;
	/** Base URL used by `buildUrl()`. */
	baseUrl: string;
	/** Request-scoped metadata available to prepare hooks and feature wrappers. */
	meta: TFetchRequestMeta;
	/** Normalized mutable headers. Header names are lowercased. */
	headers: TResolvedFetchHeaders;
	/** Request body before serialization. */
	body: TUnserializedBody | undefined;
	/** Request path or absolute URL before path params and query params are applied. */
	path: string;
	/** Mutable path params used by the active path serializer. */
	pathParams: TPathParams;
	/** Mutable query params used by the active query serializer. */
	queryParams: TQueryParams;
	/** Native fetch init options except `body`, `method`, and `headers`. */
	requestInit: TFetchRequestInit;
}

/** Open request metadata bag used by hooks and features. Extend this interface for app-specific hints. */
export interface TFetchRequestMeta {
	[key: string]: unknown;
}

export type TPrepareResponseHook = (cx: TPrepareResponseContext) => void | Promise<void>;

/**
 * Mutable response context passed to `prepareResponse` hooks before response parsing.
 * Replace `response` when reading its body so the client can still parse the final response.
 */
export interface TPrepareResponseContext {
	response: Response;
	request: TPreparedRequest;
}

/** Finalized request snapshot passed to `prepareResponse` hooks. Headers and `requestInit` are fully resolved. */
export type TPreparedRequest = Omit<TPrepareRequestContext, 'requestInit'> & {
	url: string;
	requestInit: TRequestInitWithResolvedHeaders;
};

export type TRequestInitWithResolvedHeaders = Omit<RequestInit, 'headers'> & {
	headers: TResolvedFetchHeaders;
};

// MARK: - Request

/**
 * Sends one request and returns a `tuple-result`.
 * Success values include parsed data plus response details.
 */
export interface TFetchRequest {
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json'
	>(
		method: TRequestMethod,
		path: string,
		options?: TFetchOptionsWithBody<TUnserializedBody, GParseAs>
	): Promise<TFetchRequestResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;
}

export type TParseAs = keyof TBodyType;

export type TRequestMethod = NonNullable<RequestInit['method']>;

export type TFetchOptionsWithBody<
	GBody extends TUnserializedBody = TUnserializedBody,
	GParseAs extends TParseAs = TParseAs
> = {
	/** Request body before serialization. Objects and JSON primitives are serialized by the active body serializer. */
	body?: GBody;
} & TFetchOptions<GParseAs>;

/** Request body input accepted before the active body serializer runs. */
export type TUnserializedBody = TSerializedBody | object | number | boolean;

export interface TFetchOptions<GParseAs extends TParseAs = TParseAs> {
	/** Response parser. Defaults to `json`. */
	parseAs?: GParseAs;
	/** Headers merged after client headers. `null` removes an earlier header and `undefined` is ignored. */
	headers?: TFetchHeadersInit;
	/** Base URL override for this request. Absolute request paths ignore the base URL. */
	baseUrl?: string;
	/** Native fetch init options except `body`, `method`, and `headers`. Use top-level `signal` for cancellation. */
	requestInit?: TFetchRequestInit;
	/** Abort signal for this request. Overrides `requestInit.signal` when not `undefined`; use `null` to clear it. */
	signal?: AbortSignal | null;
	/** Request-scoped metadata available to prepare hooks and feature wrappers. */
	meta?: TFetchRequestMeta;
	/** Request-scoped middleware appended after client middleware. */
	middleware?: TFetchMiddleware[];
	/** Values used by the active path serializer. */
	pathParams?: TPathParams;
	/** Values used by the active query serializer. */
	queryParams?: TQueryParams;
	/** Path serializer override for this request. */
	pathSerializer?: TPathSerializer;
	/** Query serializer override for this request. */
	querySerializer?: TQuerySerializer;
	/** Body serializer override for this request. */
	bodySerializer?: TBodySerializer;
}

export type TFetchRequestInit = Omit<RequestInit, 'body' | 'method' | 'headers'>;

export type TPathParams = Record<string, unknown>;
export type TQueryParams = Record<string, unknown>;

export type TFetchMiddleware = (next: TFetchLike) => TFetchLike;

// MARK: - Headers

export type TFetchHeadersInit = NonNullable<RequestInit['headers']> | TFetchHeadersInitRecord;
export type TFetchHeadersInitRecord = Record<string, TFetchHeaderInitValue>;
export type TFetchHeaderInitValue =
	| TFetchHeaderPrimitive
	| TFetchHeaderPrimitive[]
	| null
	| undefined;
export type TFetchHeaderPrimitive = string | number | boolean;

/** Normalized header record used internally. Header names are lowercased. */
export type TResolvedFetchHeaders = Record<string, string>;

// MARK: - Serializers

export type TPathSerializer<GPathParams extends Record<string, unknown> = Record<string, unknown>> =
	(path: string, pathParams: GPathParams) => string;

export type TQuerySerializer<
	GQueryParams extends Record<string, unknown> = Record<string, unknown>
> = (queryParams: GQueryParams) => string;

export type TBodySerializer<GBody = unknown, GResult extends TSerializedBody = TSerializedBody> = (
	body: GBody,
	contentType?: string
) => GResult;

export type TSerializedBody = RequestInit['body'];

// MARK: - Response

/** Result returned by the low-level request method. */
export type TFetchRequestResponse<
	GSuccessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GParseAs extends TParseAs = 'json'
> = TResult<
	TFetchResponseSuccess<GSuccessResponseBody, GParseAs>,
	TFetchResponseError<GErrorResponseBody>
>;

export type TFetchResponseError<GErrorResponseBody = unknown> =
	| NetworkError
	| HttpError<GErrorResponseBody>
	| FetchError;

export interface TFetchResponseSuccess<
	GSuccessResponseBody = unknown,
	GParseAs extends TParseAs = 'json'
> {
	data: TParseAsResponse<GParseAs, GSuccessResponseBody>;
	/** Response used to produce `data`. Its body is already consumed unless `parseAs` is `stream`. */
	response: Response;
}

export type TParseAsResponse<
	GParseAs extends TParseAs,
	GJson = unknown
> = TBodyType<GJson>[GParseAs];

export interface TBodyType<GJson = unknown> {
	json: GJson;
	text: Awaited<ReturnType<Response['text']>>;
	blob: Awaited<ReturnType<Response['blob']>>;
	arrayBuffer: Awaited<ReturnType<Response['arrayBuffer']>>;
	stream: Response['body'];
}
