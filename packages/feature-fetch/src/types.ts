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
	method: TRequestMethod;
	baseUrl: string;
	meta: unknown;
	headers: TResolvedFetchHeaders;
	body: TUnserializedBody | undefined;
	path: string;
	pathParams: TPathParams;
	queryParams: TQueryParams;
	requestInit: TFetchRequestInit;
}

export type TPrepareResponseHook = (cx: TPrepareResponseContext) => void | Promise<void>;

/**
 * Mutable response context passed to `prepareResponse` hooks before response parsing.
 * Replace `response` when reading its body so the client can still parse the final response.
 */
export interface TPrepareResponseContext {
	response: Response;
	request: TSentRequestContext;
}

/** Final request context used for the fetch call. Mutating it only affects later response hooks. */
export interface TSentRequestContext extends Omit<TPrepareRequestContext, 'requestInit'> {
	url: string;
	requestInit: TRequestInitWithResolvedHeaders;
}

export type TRequestInitWithResolvedHeaders = Omit<RequestInit, 'headers'> & {
	headers: TResolvedFetchHeaders;
};

// MARK: - Request

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
	body?: GBody;
} & TFetchOptions<GParseAs>;

export type TUnserializedBody = TSerializedBody | object;

export interface TFetchOptions<GParseAs extends TParseAs = TParseAs> {
	parseAs?: GParseAs;
	// Note: Overloads require explicit `true`; a generic here would still make this property optional
	withResponse?: boolean;
	headers?: TFetchHeadersInit;
	baseUrl?: string;
	requestInit?: TFetchRequestInit;
	meta?: unknown;
	middleware?: TFetchMiddleware[];
	pathParams?: TPathParams;
	queryParams?: TQueryParams;
	pathSerializer?: TPathSerializer;
	querySerializer?: TQuerySerializer;
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
