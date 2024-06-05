import { Err, Ok } from 'ts-results-es';
import { toArray } from '@ibg/utils';

import { ServiceException } from './exceptions';
import {
	buildUrl,
	FetchHeaders,
	mapErrorToNetworkException,
	mapErrorToServiceException,
	mapResponseToRequestException,
	parseAndValidateUrl,
	processRequestMiddlewares,
	serializeBody,
	serializeQueryParams
} from './helper';
import type { TFetchClient, TFetchClientConfig, TFetchClientOptions, TUrlParams } from './types';

export function createFetchClient<GPaths extends object = object>(
	options: TFetchClientOptions = {}
): TFetchClient<['base'], GPaths> {
	const config: TFetchClientConfig = {
		prefixUrl: options.prefixUrl ?? '',
		fetchProps: options.fetchProps ?? {},
		headers: options.headers != null ? new FetchHeaders(options.headers) : new FetchHeaders(),
		bodySerializer: options.bodySerializer ?? serializeBody,
		querySerializer: options.querySerializer ?? serializeQueryParams,
		middleware: toArray(options.middleware ?? []),
		fetch: options.fetch ?? typeof fetch === 'function' ? fetch : undefined
	};

	// Apply default headers
	if (!config.headers.has('Content-Type')) {
		config.headers.set('Content-Type', 'application/json; charset=utf-8');
	}

	return {
		_: null,
		_features: ['base'],
		_config: config,
		async _baseFetch(this: TFetchClient<['base']>, path, method, baseFetchOptions = {}) {
			const {
				parseAs = 'json',
				bodySerializer = this._config.bodySerializer,
				querySerializer = this._config.querySerializer,
				pathParams,
				queryParams,
				body = undefined,
				prefixUrl = this._config.prefixUrl,
				fetchProps = {},
				middlewareProps
			} = baseFetchOptions;
			const headers = new FetchHeaders(baseFetchOptions.headers);

			// Parse and validate Url to ensure that even if path is a full URL and baseUrl is an empty string,
			// the finalPath and origin can still be correctly extracted
			const { path: parsedPath, origin } = parseAndValidateUrl(
				`${prefixUrl}${path}`,
				queryParams == null
			);

			const urlParams: TUrlParams = {
				path: pathParams,
				query: queryParams
			};

			const mergedHeaders = FetchHeaders.merge(headers, this._config.headers);

			// Serialize body
			let serializedBody = body;
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

			// Remove `Content-Type` if serialized body is FormData.
			// Browser will correctly set Content-Type & boundary expression.
			if (typeof FormData !== 'undefined' && requestInit.body instanceof FormData) {
				mergedHeaders.delete('Content-Type');
			}

			// Call middlewares
			try {
				const middlewaresResponse = await processRequestMiddlewares(
					this._config.middleware,
					{
						requestInit,
						queryParams: urlParams.query,
						pathParams: urlParams.path
					},
					middlewareProps
				);
				requestInit = middlewaresResponse.requestInit;
				urlParams.path = middlewaresResponse.pathParams;
				urlParams.query = middlewaresResponse.queryParams;
			} catch (error) {
				return Err(mapErrorToServiceException(error, '#ERR_MIDDLEWARE'));
			}

			// Build final URL
			const finalUrl = buildUrl(origin, {
				path: parsedPath,
				params: urlParams,
				querySerializer
			});

			const baseFetch = this._config.fetch;
			if (baseFetch == null) {
				return Err(new ServiceException('#ERR_MISSING_FETCH'));
			}

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
						data =
							typeof response[parseAs] === 'function'
								? await response[parseAs]()
								: await response.text();
					} catch (error) {
						return Err(
							new ServiceException('#ERR_PARSE_RESPONSE', {
								message: `Failed to parse response to '${parseAs}'`
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
