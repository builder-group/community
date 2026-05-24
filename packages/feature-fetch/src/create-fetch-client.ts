import { createFeatureHost } from 'feature-core';
import { Err, Ok } from 'tuple-result';
import {
	FetchError,
	mapErrorToFetchError,
	mapErrorToNetworkError,
	mapResponseToHttpError
} from './errors';
import {
	buildUrl,
	deleteHeader,
	getHeader,
	hasHeader,
	mergeHeaders,
	normalizeHeaders,
	serializeBody,
	serializePathParams,
	serializeQueryParams,
	setHeader
} from './lib';
import { isFormData, isNativeBody } from './lib/native-body';
import type {
	TBodySerializer,
	TFetchClient,
	TFetchClientBase,
	TFetchHeadersInit,
	TFetchLike,
	TFetchMiddleware,
	TFetchOptionsWithBody,
	TFetchRequestInit,
	TFetchResponse,
	TParseAs,
	TParseAsResponse,
	TPathSerializer,
	TPrepareRequestContext,
	TPrepareRequestHook,
	TPrepareResponseContext,
	TPrepareResponseHook,
	TQuerySerializer,
	TRequestInitWithResolvedHeaders,
	TRequestMethod,
	TResolvedFetchHeaders,
	TSerializedBody,
	TUnserializedBody
} from './types';

/**
 * Creates a feature host around fetch.
 */
export function createFetchClient(options: TCreateFetchClientOptions = {}): TFetchClient<[]> {
	const {
		baseUrl = '',
		requestInit = {},
		headers,
		bodySerializer = serializeBody,
		pathSerializer = serializePathParams,
		querySerializer = serializeQueryParams,
		prepareRequest = [],
		prepareResponse = [],
		middleware = [],
		fetch
	} = options;
	return createFeatureHost<TFetchClientBase>({
		_config: {
			baseUrl,
			requestInit,
			headers: normalizeHeaders(headers),
			bodySerializer,
			pathSerializer,
			querySerializer,
			prepareRequest,
			prepareResponse,
			middleware
		},
		_fetchLike: resolveFetchLike(fetch),
		async request<
			GSuccessResponseBody = unknown,
			GErrorResponseBody = unknown,
			GParseAs extends TParseAs = 'json'
		>(
			this: TFetchClientBase,
			method: TRequestMethod,
			path: string,
			requestOptions: TFetchOptionsWithBody<TUnserializedBody, GParseAs> = {}
		): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, boolean>> {
			const {
				parseAs = 'json',
				body,
				bodySerializer = this._config.bodySerializer,
				meta,
				requestInit: requestInitOverrides = {},
				pathParams = {},
				pathSerializer = this._config.pathSerializer,
				baseUrl = this._config.baseUrl,
				queryParams = {},
				querySerializer = this._config.querySerializer,
				middleware: requestMiddleware = [],
				withResponse = false
			} = requestOptions;

			const cx: TPrepareRequestContext = {
				baseUrl,
				body,
				meta,
				headers: mergeHeaders(this._config.headers, requestOptions.headers),
				method,
				path,
				pathParams: { ...pathParams },
				queryParams: { ...queryParams },
				requestInit: {
					...this._config.requestInit,
					...requestInitOverrides
				}
			};

			try {
				for (const prepareRequest of this._config.prepareRequest) {
					await prepareRequest(cx);
				}
			} catch (error) {
				return Err(
					mapErrorToFetchError(error, '#ERR_PREPARE_REQUEST', 'Failed to prepare request')
				);
			}

			let serializedBody: TSerializedBody;
			try {
				serializedBody = prepareRequestBody(cx.body, bodySerializer, cx.headers);
			} catch (error) {
				return Err(
					mapErrorToFetchError(error, '#ERR_SERIALIZE_BODY', 'Failed to serialize request body')
				);
			}

			let url: string;
			try {
				url = buildUrl(cx.baseUrl, {
					path: cx.path,
					pathParams: cx.pathParams,
					pathSerializer,
					queryParams: cx.queryParams,
					querySerializer
				});
			} catch (error) {
				return Err(mapErrorToFetchError(error, '#ERR_BUILD_URL', 'Failed to build request URL'));
			}

			const requestMethod = cx.method.toUpperCase();
			const requestInit: TRequestInitWithResolvedHeaders = {
				redirect: 'follow',
				...cx.requestInit,
				method: requestMethod,
				headers: cx.headers,
				body: serializedBody
			};

			let fetchLike: TFetchLike;
			try {
				const hasMiddleware = this._config.middleware.length > 0 || requestMiddleware.length > 0;
				if (hasMiddleware) {
					fetchLike = this._config.middleware
						.concat(requestMiddleware)
						.reduceRight((next, fetchMiddleware) => fetchMiddleware(next), this._fetchLike);
				} else {
					fetchLike = this._fetchLike;
				}
			} catch (error) {
				return Err(
					mapErrorToFetchError(error, '#ERR_FETCH_MIDDLEWARE', 'Failed to compose fetch middleware')
				);
			}

			let response: Response;
			try {
				response = await fetchLike(url, requestInit);
			} catch (error) {
				if (error instanceof FetchError) {
					return Err(error);
				}
				return Err(mapErrorToNetworkError(error));
			}

			if (this._config.prepareResponse.length > 0) {
				const responseCx: TPrepareResponseContext = {
					request: {
						...cx,
						method: requestMethod,
						requestInit,
						url
					},
					response
				};

				try {
					for (const prepareResponse of this._config.prepareResponse) {
						await prepareResponse(responseCx);
					}
					response = responseCx.response;
				} catch (error) {
					return Err(
						mapErrorToFetchError(error, '#ERR_PREPARE_RESPONSE', 'Failed to prepare response')
					);
				}
			}

			if (response.ok) {
				try {
					const data = await parseResponseData<GSuccessResponseBody, GParseAs>(
						response,
						requestMethod,
						parseAs as GParseAs
					);
					return Ok(withResponse ? { data, response } : data);
				} catch (error) {
					return Err(mapErrorToFetchError(error, '#ERR_PARSE_RESPONSE_DATA'));
				}
			}

			return Err(await mapResponseToHttpError(response));
		}
	});
}

export interface TCreateFetchClientOptions {
	/** Base URL prepended to relative request paths. */
	baseUrl?: string;
	/** Native fetch init defaults except `body`, `method`, and `headers`. */
	requestInit?: TFetchRequestInit;
	/** Headers applied to every request. */
	headers?: TFetchHeadersInit;
	/** Default body serializer. */
	bodySerializer?: TBodySerializer;
	/** Default path param serializer. */
	pathSerializer?: TPathSerializer;
	/** Default query param serializer. */
	querySerializer?: TQuerySerializer;
	/** Hooks that can mutate request data before URL/body creation. */
	prepareRequest?: TPrepareRequestHook[];
	/** Hooks that can inspect or replace the response before parsing/error mapping. */
	prepareResponse?: TPrepareResponseHook[];
	/** Middleware applied around fetch for every request. */
	middleware?: TFetchMiddleware[];
	/** Fetch implementation. Defaults to `globalThis.fetch`. */
	fetch?: TFetchLike;
}

function resolveFetchLike(fetchLike?: TFetchLike): TFetchLike {
	if (typeof fetchLike === 'function') {
		return fetchLike;
	}
	if (typeof globalThis.fetch === 'function') {
		return globalThis.fetch.bind(globalThis) as TFetchLike;
	}

	return async () => {
		throw new FetchError('#ERR_MISSING_FETCH', {
			message: "Failed to find a valid 'fetch' function"
		});
	};
}

function prepareRequestBody(
	body: TUnserializedBody | undefined,
	bodySerializer: TBodySerializer,
	headers: TResolvedFetchHeaders
): TSerializedBody | undefined {
	if (body === undefined) {
		return undefined;
	}

	if (!isNativeBody(body) && !hasHeader(headers, 'Content-Type')) {
		setHeader(headers, 'Content-Type', 'application/json; charset=utf-8');
	}

	const serializedBody = bodySerializer(body, getHeader(headers, 'Content-Type') ?? undefined);
	// Note: Delete Content-Type so fetch can add the required multipart boundary for FormData
	if (isFormData(serializedBody)) {
		deleteHeader(headers, 'Content-Type');
	}

	return serializedBody;
}

async function parseResponseData<GSuccessResponseBody, GParseAs extends TParseAs>(
	response: Response,
	method: TRequestMethod,
	parseAs: GParseAs
): Promise<TParseAsResponse<GParseAs, GSuccessResponseBody>> {
	if (isEmptyResponse(response, method)) {
		return undefined as TParseAsResponse<GParseAs, GSuccessResponseBody>;
	}
	if (parseAs === 'stream') {
		return response.body as TParseAsResponse<GParseAs, GSuccessResponseBody>;
	}

	try {
		switch (parseAs) {
			case 'arrayBuffer':
				return (await response.arrayBuffer()) as TParseAsResponse<GParseAs, GSuccessResponseBody>;
			case 'blob':
				return (await response.blob()) as TParseAsResponse<GParseAs, GSuccessResponseBody>;
			case 'json': {
				// Note: response.json() throws on empty bodies, so parse text only when present
				const text = await response.text();
				return (text.length ? JSON.parse(text) : undefined) as TParseAsResponse<
					GParseAs,
					GSuccessResponseBody
				>;
			}
			case 'text':
				return (await response.text()) as TParseAsResponse<GParseAs, GSuccessResponseBody>;
			default:
				throw new FetchError('#ERR_PARSE_RESPONSE_DATA', {
					message: `Unsupported response parser '${parseAs}'`
				});
		}
	} catch (error) {
		if (error instanceof FetchError) {
			throw error;
		}
		throw new FetchError('#ERR_PARSE_RESPONSE_DATA', {
			message: `Failed to parse response as '${parseAs}'`,
			cause: error
		});
	}
}

function isEmptyResponse(response: Response, method: TRequestMethod): boolean {
	const contentLength = response.headers.get('Content-Length')?.trim();
	const transferEncoding = response.headers.get('Transfer-Encoding')?.toLowerCase();

	const hasNoContentStatus = response.status === 204 || response.status === 205;
	const hasNoBodyMethod = method === 'HEAD';
	const hasExplicitEmptyBody = contentLength === '0' && !transferEncoding?.includes('chunked');
	return hasNoContentStatus || hasNoBodyMethod || hasExplicitEmptyBody;
}
