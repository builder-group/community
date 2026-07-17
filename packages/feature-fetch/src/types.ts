import type { TAnyFeature, TFeatureHost } from 'feature-core';
import type { TResult } from 'tuple-result';
import type { FetchError, HttpError, NetworkError } from './errors';

// MARK: - Client

/** Represents a fetch client returned by `createFetchClient()` and extended through `.with()`. */
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
	/** Sends one request and returns parsed data plus the raw response on the success branch. */
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

/**
 * Hook that can mutate structured request inputs before URL and body serialization.
 * Throwing from this hook returns a `FetchError` on the tuple-result error branch.
 */
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

/**
 * Hook that can inspect or replace the raw response before the client parses it.
 * Replace `cx.response` after reading a body so later parsing still has a readable response.
 */
export type TPrepareResponseHook = (cx: TPrepareResponseContext) => void | Promise<void>;

/**
 * Mutable response context passed to `prepareResponse` hooks before response parsing.
 * Replace `response` when reading its body so the client can still parse the final response.
 */
export interface TPrepareResponseContext {
	response: Response;
	request: TPreparedRequest;
}

/** Final request snapshot passed to `prepareResponse` hooks. */
export type TPreparedRequest = Omit<TPrepareRequestContext, 'requestInit'> & {
	/** Fully built URL after base URL, path params, and query params are applied. */
	url: string;
	/** Native fetch init with resolved headers, method, body, and signal. */
	requestInit: TRequestInitWithResolvedHeaders;
};

/** Native fetch init with feature-fetch's normalized header record. */
export type TRequestInitWithResolvedHeaders = Omit<RequestInit, 'headers'> & {
	headers: TResolvedFetchHeaders;
};

// MARK: - Request

/**
 * Sends one HTTP request and returns a tuple result.
 *
 * The success branch is `{ data, response }`. The error branch is `NetworkError`,
 * `HttpError<GErrorResponseBody>`, or `FetchError`.
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

/** Response parser names supported by `parseAs`. */
export type TParseAs = keyof TBodyType;

export type TRequestMethod = NonNullable<RequestInit['method']>;

/** Request options for methods that can send a request body. */
export type TFetchOptionsWithBody<
	GBody extends TUnserializedBody = TUnserializedBody,
	GParseAs extends TParseAs = TParseAs
> = {
	/** Request body before serialization. Objects and JSON primitives are serialized by the active body serializer. */
	body?: GBody;
	/** Body serializer override for this request. */
	bodySerializer?: TBodySerializer<GBody>;
} & TFetchOptions<GParseAs>;

/** Defines request body input accepted before the active body serializer runs. */
export type TUnserializedBody = TSerializedBody | object | number | boolean;

/** Request-scoped options accepted by `request()` and installed method features. */
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
}

export type TFetchRequestInit = Omit<RequestInit, 'body' | 'method' | 'headers'>;

/** Values used to replace `{param}` placeholders in a request path. */
export type TPathParams = Record<string, unknown>;
/** Values serialized into the request query string. */
export type TQueryParams = Record<string, unknown>;

/**
 * Middleware wrapper around the final fetch call.
 * Use middleware for transport behavior such as retry, cache, tracing, or timing.
 */
export type TFetchMiddleware = (next: TFetchLike) => TFetchLike;

// MARK: - Headers

/** Defines header input accepted by client and request options. */
export type TFetchHeadersInit = NonNullable<RequestInit['headers']> | TFetchHeadersInitRecord;
/** Header record that also supports primitive arrays, `null` deletes, and ignored `undefined` values. */
export type TFetchHeadersInitRecord = Record<string, TFetchHeaderInitValue>;
export type TFetchHeaderInitValue =
	TFetchHeaderPrimitive | TFetchHeaderPrimitive[] | null | undefined;
export type TFetchHeaderPrimitive = string | number | boolean;

/** Normalized header record used internally. Header names are lowercased. */
export type TResolvedFetchHeaders = Record<string, string>;

// MARK: - Serializers

/** Serializes request path params into a path string. */
export type TPathSerializer<GPathParams extends Record<string, unknown> = Record<string, unknown>> =
	(path: string, pathParams: GPathParams) => string;

/** Serializes request query params without a leading question mark. */
export type TQuerySerializer<
	GQueryParams extends Record<string, unknown> = Record<string, unknown>
> = (queryParams: GQueryParams) => string;

/** Serializes a request body before it is passed to fetch. */
export type TBodySerializer<
	GBody = TUnserializedBody,
	GResult extends TSerializedBody = TSerializedBody
> = (body: GBody, contentType?: string) => GResult;

export type TSerializedBody = RequestInit['body'];

// MARK: - Response

/** Represents the tuple result returned by the low-level request method. */
export type TFetchRequestResponse<
	GSuccessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GParseAs extends TParseAs = 'json'
> = TResult<
	TFetchResponseSuccess<GSuccessResponseBody, GParseAs>,
	TFetchResponseError<GErrorResponseBody>
>;

/** Error union returned by feature-fetch request methods. */
export type TFetchResponseError<GErrorResponseBody = unknown> =
	NetworkError | HttpError<GErrorResponseBody> | FetchError;

/** Success value returned by the low-level `request()` method. */
export interface TFetchResponseSuccess<
	GSuccessResponseBody = unknown,
	GParseAs extends TParseAs = 'json'
> {
	/** Parsed response body. */
	data: TParseAsResponse<GParseAs, GSuccessResponseBody>;
	/** Response used to produce `data`. Its body is already consumed unless `parseAs` is `stream`. */
	response: Response;
}

/** Maps a parser name to the corresponding success data type. */
export type TParseAsResponse<
	GParseAs extends TParseAs,
	GJson = unknown
> = TBodyType<GJson>[GParseAs];

/** Response body types returned by each parser mode. */
export interface TBodyType<GJson = unknown> {
	json: GJson;
	text: Awaited<ReturnType<Response['text']>>;
	blob: Awaited<ReturnType<Response['blob']>>;
	arrayBuffer: Awaited<ReturnType<Response['arrayBuffer']>>;
	stream: Response['body'];
}
