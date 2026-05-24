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
	prepareResponse: TPrepareResponseHook[];
	middleware: TFetchMiddleware[];
}

export type TPrepareRequestHook = (cx: TPrepareRequestContext) => void | Promise<void>;

/** Mutable request context passed to `prepareRequest` hooks before URL/body creation. */
export interface TPrepareRequestContext {
	/** HTTP method before final uppercasing. */
	method: TRequestMethod;
	/** Base URL used by `buildUrl()`. */
	baseUrl: string;
	/** Request metadata forwarded from options. */
	meta: unknown;
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

export type TPrepareResponseHook = (cx: TPrepareResponseContext) => void | Promise<void>;

/**
 * Mutable response context passed to `prepareResponse` hooks before response parsing.
 * Replace `response` when reading its body so the client can still parse the final response.
 */
export interface TPrepareResponseContext {
	response: Response;
	request: Omit<TPrepareRequestContext, 'requestInit'> & {
		url: string;
		requestInit: TRequestInitWithResolvedHeaders;
	};
}

export type TRequestInitWithResolvedHeaders = Omit<RequestInit, 'headers'> & {
	headers: TResolvedFetchHeaders;
};

// MARK: - Request

/**
 * Sends one request and returns a `tuple-result`.
 * Success values are parsed data by default; pass `withResponse: true` to include the raw response.
 */
export interface TFetchRequest {
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json'
	>(
		method: TRequestMethod,
		path: string,
		options: TFetchOptionsWithBody<TUnserializedBody, GParseAs> & { withResponse: true }
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, true>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json'
	>(
		method: TRequestMethod,
		path: string,
		options?: TFetchOptionsWithBody<TUnserializedBody, GParseAs> & { withResponse?: false }
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json',
		GWithResponse extends boolean = boolean
	>(
		method: TRequestMethod,
		path: string,
		options?: TFetchOptionsWithBody<TUnserializedBody, GParseAs> & {
			withResponse?: GWithResponse;
		}
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, GWithResponse>>;
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
	// Note: Overloads require explicit `true`; a generic here would still make this property optional
	/** When true, success values include both parsed data and the raw `Response`. */
	withResponse?: boolean;
	/** Headers merged after client headers. `null` removes an earlier header and `undefined` is ignored. */
	headers?: TFetchHeadersInit;
	/** Base URL override for this request. Absolute request paths ignore the base URL. */
	baseUrl?: string;
	/** Native fetch init options except `body`, `method`, and `headers`, which are owned by this client. */
	requestInit?: TFetchRequestInit;
	/** Arbitrary data forwarded to prepare hooks. */
	meta?: unknown;
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

/** Result returned by fetch requests. The success branch is parsed data unless `withResponse` is true. */
export type TFetchResponse<
	GSuccessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GParseAs extends TParseAs = 'json',
	GWithResponse extends boolean = false
> = TResult<
	TFetchResponseSuccess<GSuccessResponseBody, GParseAs, GWithResponse>,
	TFetchResponseError<GErrorResponseBody>
>;

export type TFetchResponseError<GErrorResponseBody = unknown> =
	| NetworkError
	| HttpError<GErrorResponseBody>
	| FetchError;

export type TFetchResponseSuccess<
	GSuccessResponseBody = unknown,
	GParseAs extends TParseAs = 'json',
	GWithResponse extends boolean = false
> = GWithResponse extends true
	? {
			data: TParseAsResponse<GParseAs, GSuccessResponseBody>;
			response: Response;
		}
	: TParseAsResponse<GParseAs, GSuccessResponseBody>;

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
