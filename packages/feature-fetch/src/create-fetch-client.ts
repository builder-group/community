import { Err, Ok } from '@blgc/utils';

import { FetchError } from './exceptions';
import {
	buildUrl,
	FetchHeaders,
	mapErrorToFetchError,
	mapErrorToNetworkError,
	mapResponseToRequestError,
	serializeBody,
	serializePathParams,
	serializeQueryParams
} from './helper';
import type {
	TFetchClient,
	TFetchClientConfig,
	TFetchClientOptions,
	TFetchLike,
	TSerializedBody
} from './types';
import { type TRequestInitWithHeadersObject } from './types/fetch';

export function createFetchClient<GPaths extends object = object>(
	options: TFetchClientOptions = {}
): TFetchClient<['base'], GPaths> {
	const config: TFetchClientConfig = {
		prefixUrl: options.prefixUrl ?? '',
		fetchProps: options.fetchProps ?? {},
		headers: options.headers != null ? new FetchHeaders(options.headers) : new FetchHeaders(),
		bodySerializer: options.bodySerializer ?? serializeBody,
		pathSerializer: options.pathSerializer ?? serializePathParams,
		querySerializer:
			options.querySerializer ?? ((queryParams) => serializeQueryParams(queryParams)),
		beforeRequestMiddlewares: options.beforeRequestMiddlewares ?? [],
		requestMiddlewares: options.requestMiddlewares ?? []
	};
	let fetchLike: TFetchLike;
	if (typeof options.fetch === 'function') {
		fetchLike = options.fetch;
	} else if (typeof fetch === 'function') {
		fetchLike = fetch;
	} else {
		throw new FetchError('#ERR_MISSING_FETCH', {
			description: "Failed to find valid 'fetch' function to wrap around!"
		});
	}

	// Apply default headers
	if (!config.headers.has('Content-Type')) {
		config.headers.set('Content-Type', 'application/json; charset=utf-8');
	}

	return {
		_: null,
		_features: ['base'],
		_fetchLike: fetchLike,
		_config: config,
		async _baseFetch(this: TFetchClient<['base']>, path, method, baseFetchOptions = {}) {
			const {
				parseAs = 'json',
				pathSerializer = this._config.pathSerializer,
				querySerializer = this._config.querySerializer,
				bodySerializer = this._config.bodySerializer,
				body = undefined,
				prefixUrl = this._config.prefixUrl,
				fetchProps = {},
				middlewareProps,
				pathParams = {},
				queryParams = {}
			} = baseFetchOptions;
			const headers = new FetchHeaders(baseFetchOptions.headers);
			const mergedHeaders = FetchHeaders.merge(headers, this._config.headers);

			// Serialize body
			let serializedBody: TSerializedBody;
			if (body != null) {
				try {
					serializedBody = bodySerializer(body, mergedHeaders.get('Content-Type') ?? undefined);
				} catch (error) {
					return Err(mapErrorToFetchError(error, '#ERR_SERIALIZE_BODY'));
				}
			}

			// Build request init object
			const requestInit: TRequestInitWithHeadersObject = {
				redirect: 'follow',
				...this._config.fetchProps,
				...fetchProps,
				method,
				headers: mergedHeaders.toHeadersInit(),
				body: serializedBody
			};

			// Remove `Content-Type` if body is FormData.
			// Browser will correctly set Content-Type & boundary expression.
			if (typeof FormData !== 'undefined' && requestInit.body instanceof FormData) {
				delete requestInit.headers['Content-Type'];
			}

			// Process before request middlewares
			try {
				for (const middleware of this._config.beforeRequestMiddlewares) {
					// eslint-disable-next-line no-await-in-loop -- Needs to be processed in order
					await middleware({
						path,
						props: middlewareProps,
						requestInit,
						queryParams,
						pathParams
					});
				}
			} catch (error) {
				return Err(mapErrorToFetchError(error, '#ERR_MIDDLEWARE'));
			}

			// Build final Url
			const finalUrl = buildUrl(prefixUrl, {
				path,
				pathParams,
				queryParams,
				pathSerializer,
				querySerializer
			});

			// Process request middlewares
			const baseFetch = this._config.requestMiddlewares.reduceRight(
				(acc, middleware) => middleware(acc),
				this._fetchLike
			);

			// Send request
			let response: Response;
			try {
				response = await baseFetch(finalUrl, requestInit);
			} catch (error) {
				return Err(mapErrorToNetworkError(error));
			}

			// Handle ok response (parse as "parseAs" and falling back to .text() when necessary)
			if (response.ok) {
				let data: any = response.body;
				if (parseAs !== 'stream') {
					try {
						data = await response[parseAs]();
					} catch (error) {
						return Err(
							new FetchError('#ERR_PARSE_RESPONSE_DATA', {
								description: `Failed to parse response as '${parseAs}'`
							})
						);
					}
				}
				return Ok({ data, response });
			}

			// Handle errors (always parse as .json() or .text())
			return Err(await mapResponseToRequestError(response));
		}
	};
}
