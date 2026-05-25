import { defineFeature, type TFeature } from 'feature-core';
import { mapOk, type TResult } from 'tuple-result';
import { createFetchClient, type TCreateFetchClientOptions } from '../create-fetch-client';
import type {
	TFetchClient,
	TFetchClientBase,
	TFetchOptions,
	TFetchOptionsWithBody,
	TFetchResponseError,
	TFetchResponseSuccess,
	TParseAs,
	TParseAsResponse,
	TRequestMethod,
	TUnserializedBody
} from '../types';

/** Creates a fetch client with REST method helpers already installed. */
export function createApiFetchClient(
	options: TCreateFetchClientOptions = {}
): TFetchClient<[TApiFeature]> {
	return createFetchClient(options).with(apiFeature());
}

// MARK: - Feature

/**
 * Adds REST method helpers around `request()`.
 * Helpers unwrap the low-level success value to `data` unless `withResponse: true` is passed.
 */
export function apiFeature(): TApiFeature {
	return defineFeature<TApiFeature>({
		key: 'api',
		install() {
			return {
				get: createApiMethod('GET') as TApiMethod,
				post: createApiMethod('POST') as TApiBodyMethod,
				put: createApiMethod('PUT') as TApiBodyMethod,
				patch: createApiMethod('PATCH') as TApiBodyMethod,
				delete: createApiMethod('DELETE') as TApiBodyMethod,
				options: createApiMethod('OPTIONS') as TApiMethod,
				head: createApiMethod('HEAD') as TApiMethod,
				trace: createApiMethod('TRACE') as TApiMethod
			};
		}
	});
}

export type TApiFeature = TFeature<'api', TApiFeatureApi>;

export interface TApiFeatureApi {
	get: TApiMethod;
	post: TApiBodyMethod;
	put: TApiBodyMethod;
	patch: TApiBodyMethod;
	delete: TApiBodyMethod;
	options: TApiMethod;
	head: TApiMethod;
	trace: TApiMethod;
}

// MARK: - Method

function createApiMethod(method: TRequestMethod) {
	return async function apiMethod(
		this: TFetchClientBase,
		path: string,
		options: TApiMethodOptions = {}
	) {
		const { withResponse = false, ...fetchOptions } = options;
		const requestResult = await this.request(method, path, fetchOptions);
		return withResponse ? requestResult : mapOk(requestResult, ({ data }) => data);
	};
}

type TApiMethodOptions = TFetchOptionsWithBody & {
	withResponse?: boolean;
};

/**
 * Sends a REST request without a request body.
 *
 * By default the success branch is parsed data. Pass `withResponse: true` to receive
 * `{ data, response }` instead.
 */
export interface TApiMethod {
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		options: TFetchOptions<GParseAs> & { withResponse: true }
	): Promise<TApiResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, true>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		options?: TFetchOptions<GParseAs> & { withResponse?: false }
	): Promise<TApiResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json',
		GWithResponse extends boolean = boolean
	>(
		path: string,
		options?: TFetchOptions<GParseAs> & { withResponse?: GWithResponse }
	): Promise<TApiResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, GWithResponse>>;
}

/**
 * Sends a REST request that can include a request body.
 *
 * By default the success branch is parsed data. Pass `withResponse: true` to receive
 * `{ data, response }` instead.
 */
export interface TApiBodyMethod {
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GRequestBody extends TUnserializedBody = Record<string, unknown>,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		options: TFetchOptionsWithBody<GRequestBody, GParseAs> & { withResponse: true }
	): Promise<TApiResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, true>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GRequestBody extends TUnserializedBody = Record<string, unknown>,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		options?: TFetchOptionsWithBody<GRequestBody, GParseAs> & { withResponse?: false }
	): Promise<TApiResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GRequestBody extends TUnserializedBody = Record<string, unknown>,
		GParseAs extends TParseAs = 'json',
		GWithResponse extends boolean = boolean
	>(
		path: string,
		options?: TFetchOptionsWithBody<GRequestBody, GParseAs> & {
			withResponse?: GWithResponse;
		}
	): Promise<TApiResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, GWithResponse>>;
}

// MARK: - Response

type TApiResponse<
	GSuccessResponseBody = unknown,
	GErrorResponseBody = unknown,
	GParseAs extends TParseAs = 'json',
	GWithResponse extends boolean = false
> = TResult<
	GWithResponse extends true
		? TFetchResponseSuccess<GSuccessResponseBody, GParseAs>
		: TParseAsResponse<GParseAs, GSuccessResponseBody>,
	TFetchResponseError<GErrorResponseBody>
>;
