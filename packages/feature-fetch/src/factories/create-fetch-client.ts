import { Err, Ok } from 'ts-results-es';
import { toArray } from '@ibg/utils';

import type { TFetchClient, TFetchClientConfig, TFetchClientOptions, TURLParams } from '../types';
import {
	buildUrl,
	FetchHeaders,
	fetchWithRetries,
	mapErrorToNetworkException,
	mapErrorToServiceException,
	mapResponseToRequestException,
	parseAndValidateUrl,
	processRequestMiddlewares,
	serializeBody,
	serializeQueryParams
} from '../utils';

export function createFetchClient<GPaths extends {} = {}>(
	options: TFetchClientOptions = {}
): TFetchClient<['base'], GPaths> {
	const config: TFetchClientConfig = {
		prefixUrl: options.prefixUrl ?? '',
		fetchProps: options.fetchProps ?? {},
		headers: options.headers != null ? new FetchHeaders(options.headers) : new FetchHeaders(),
		bodySerializer: options.bodySerializer ?? serializeBody,
		querySerializer: options.querySerializer ?? serializeQueryParams,
		middleware: toArray(options.middleware ?? [])
	};

	// Apply default content type header
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
				pathPrefix = this._config.prefixUrl,
				fetchProps = {},
				middlewareProps
			} = baseFetchOptions;
			const headers = new FetchHeaders(baseFetchOptions.headers);

			// Parse and validate URL to ensure that even if path is a full URL and baseUrl is an empty string,
			// the finalPath and origin can still be correctly extracted
			const { path: parsedPath, origin } = parseAndValidateUrl(
				`${pathPrefix}${path}`,
				queryParams == null
			);

			const urlParams: TURLParams = {
				path: pathParams,
				query: queryParams
			};

			// Build request init object
			const mergedHeaders = FetchHeaders.merge(headers, this._config.headers);
			let requestInit: RequestInit = {
				redirect: 'follow',
				...this._config.fetchProps,
				...fetchProps,
				method,
				headers: mergedHeaders.toHeadersInit(),
				body:
					body != null
						? bodySerializer(body, mergedHeaders.get('Content-Type') ?? undefined)
						: undefined
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

			// Send request
			let response: Response;
			try {
				response = await fetchWithRetries(finalUrl, {
					requestInit
				});
			} catch (error) {
				return Err(mapErrorToNetworkException(error));
			}

			// Handle ok response (parse as "parseAs" and falling back to .text() when necessary)
			if (response.ok) {
				let data: any = response.body;
				if (parseAs !== 'stream') {
					const cloned = typeof response.clone === 'function' ? response.clone() : response; // Clone method not supported by Figma sandbox environment
					try {
						data =
							typeof cloned[parseAs] === 'function' ? await cloned[parseAs]() : await cloned.text();
					} catch (error) {
						data = cloned.text();
					}
				}
				return Ok({ data, response });
			}

			// Handle errors (always parse as .json() or .text())
			return Err(await mapResponseToRequestException(response));
		}
	};
}
