import { Err, Ok } from 'ts-results-es';

import { ServiceException } from './exceptions';
import {
	buildUrl,
	FetchHeaders,
	mapErrorToNetworkException,
	mapErrorToServiceException,
	mapResponseToRequestException,
	processBeforeRequestMiddlewares,
	processRequestMiddlewares,
	serializeBody,
	serializePathParams,
	serializeQueryParams
} from './helper';
import type {
	TFetchClient,
	TFetchClientConfig,
	TFetchClientOptions,
	TFetchLike,
	TPathParams,
	TQueryParams,
	TSerializedBody
} from './types';

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
		throw new ServiceException('#ERR_MISSING_FETCH', {
			message: "Failed to find valid 'fetch' function to wrap around!"
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
				middlewareProps
			} = baseFetchOptions;
			const headers = new FetchHeaders(baseFetchOptions.headers);
			const mergedHeaders = FetchHeaders.merge(headers, this._config.headers);
			let pathParams: TPathParams | undefined = baseFetchOptions.pathParams;
			let queryParams: TQueryParams | undefined = baseFetchOptions.queryParams;

			// Serialize body
			let serializedBody: TSerializedBody;
			if (body != null) {
				try {
					serializedBody = bodySerializer(body, mergedHeaders.get('Content-Type') ?? undefined);
				} catch (error) {
					return Err(mapErrorToServiceException(error, '#ERR_SERIALIZE_BODY'));
				}
			}

			// Build request init object
			let requestInit: RequestInit = {
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
				mergedHeaders.delete('Content-Type');
			}

			// Process before request middlewares
			try {
				const middlewaresResponse = await processBeforeRequestMiddlewares(
					this._config.beforeRequestMiddlewares,
					{
						requestInit,
						queryParams,
						pathParams
					},
					middlewareProps
				);
				requestInit = middlewaresResponse.requestInit;
				pathParams = middlewaresResponse.pathParams;
				queryParams = middlewaresResponse.queryParams;
			} catch (error) {
				return Err(mapErrorToServiceException(error, '#ERR_MIDDLEWARE'));
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
			const baseFetch = processRequestMiddlewares(this._config.requestMiddlewares, this._fetchLike);

			// Send request
			let response: Response;
			try {
				response = await baseFetch(finalUrl, requestInit);
			} catch (error) {
				return Err(mapErrorToNetworkException(error));
			}

			// Handle ok response (parse as "parseAs" and falling back to .text() when necessary)
			if (response.ok) {
				let data: any = response.body;
				if (parseAs !== 'stream') {
					try {
						data = await response[parseAs]();
					} catch (error) {
						return Err(
							new ServiceException('#ERR_PARSE_RESPONSE_DATA', {
								message: `Failed to parse response as '${parseAs}'`
							})
						);
					}
				}
				return Ok({ data, response });
			}

			// Handle errors (always parse as .json() or .text())
			return Err(await mapResponseToRequestException(response));
		}
	};
}
