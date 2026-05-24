import { defineFeature, type TFeature } from 'feature-core';
import { createFetchClient, type TCreateFetchClientOptions } from '../create-fetch-client';
import type {
	TFetchClient,
	TFetchClientBase,
	TFetchOptions,
	TFetchOptionsWithBody,
	TFetchResponse,
	TParseAs,
	TRequestMethod,
	TUnserializedBody
} from '../types';

/** Creates a fetch client with `apiFeature()` installed. */
export function createApiFetchClient(
	options: TCreateFetchClientOptions = {}
): TFetchClient<[TApiFeature]> {
	return createFetchClient(options).with(apiFeature());
}

// MARK: - Feature

/** Adds HTTP method helpers around `request()`. */
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
	return function apiMethod(
		this: TFetchClientBase,
		path: string,
		options: TFetchOptionsWithBody = {}
	) {
		return this.request(method, path, options);
	};
}

export interface TApiMethod {
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		options: TFetchOptions<GParseAs> & { withResponse: true }
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, true>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		options?: TFetchOptions<GParseAs> & { withResponse?: false }
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GParseAs extends TParseAs = 'json',
		GWithResponse extends boolean = boolean
	>(
		path: string,
		options?: TFetchOptions<GParseAs> & { withResponse?: GWithResponse }
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, GWithResponse>>;
}

export interface TApiBodyMethod {
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GRequestBody extends TUnserializedBody = Record<string, unknown>,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		options: TFetchOptionsWithBody<GRequestBody, GParseAs> & { withResponse: true }
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, true>>;
	<
		GSuccessResponseBody = unknown,
		GErrorResponseBody = unknown,
		GRequestBody extends TUnserializedBody = Record<string, unknown>,
		GParseAs extends TParseAs = 'json'
	>(
		path: string,
		options?: TFetchOptionsWithBody<GRequestBody, GParseAs> & { withResponse?: false }
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs>>;
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
	): Promise<TFetchResponse<GSuccessResponseBody, GErrorResponseBody, GParseAs, GWithResponse>>;
}
