import { defineFeature, type TFeature } from 'feature-core';
import type {
	ErrorResponse,
	FilterKeys,
	HttpMethod,
	IsOperationRequestBodyOptional,
	MediaType,
	OperationRequestBodyContent,
	PathsWithMethod,
	Readable,
	RequiredKeysOf,
	ResponseObjectMap,
	SuccessResponse,
	Writable
} from 'openapi-typescript-helpers';
import { createFetchClient, type TCreateFetchClientOptions } from '../create-fetch-client';
import type {
	TBodySerializer,
	TFetchClient,
	TFetchClientBase,
	TFetchHeadersInit,
	TFetchHeadersInitRecord,
	TFetchOptions,
	TFetchOptionsWithBody,
	TFetchResponse,
	TParseAs,
	TPathSerializer,
	TQuerySerializer,
	TRequestMethod
} from '../types';

/** Creates a fetch client with `openApiFeature()` installed. */
export function createOpenApiFetchClient<GPaths extends object = object>(
	options: TCreateFetchClientOptions = {}
): TFetchClient<[TOpenApiFeature<GPaths>]> {
	return createFetchClient(options).with(openApiFeature<GPaths>());
}

/** Adds OpenAPI-typed HTTP method helpers. */
export function openApiFeature<GPaths extends object = object>(): TOpenApiFeature<GPaths> {
	return defineFeature<TOpenApiFeature<GPaths>>({
		key: 'openapi',
		install() {
			return {
				get: createOpenApiMethod<GPaths, 'get'>('GET'),
				post: createOpenApiMethod<GPaths, 'post'>('POST'),
				put: createOpenApiMethod<GPaths, 'put'>('PUT'),
				patch: createOpenApiMethod<GPaths, 'patch'>('PATCH'),
				delete: createOpenApiMethod<GPaths, 'delete'>('DELETE'),
				options: createOpenApiMethod<GPaths, 'options'>('OPTIONS'),
				head: createOpenApiMethod<GPaths, 'head'>('HEAD'),
				trace: createOpenApiMethod<GPaths, 'trace'>('TRACE')
			};
		}
	});
}

// MARK: - Feature

export type TOpenApiFeature<GPaths extends object = object> = TFeature<
	'openapi',
	TOpenApiFeatureApi<GPaths>
>;

export interface TOpenApiFeatureApi<GPaths extends object> {
	get: TOpenApiMethod<GPaths, 'get'>;
	post: TOpenApiMethod<GPaths, 'post'>;
	put: TOpenApiMethod<GPaths, 'put'>;
	patch: TOpenApiMethod<GPaths, 'patch'>;
	delete: TOpenApiMethod<GPaths, 'delete'>;
	options: TOpenApiMethod<GPaths, 'options'>;
	head: TOpenApiMethod<GPaths, 'head'>;
	trace: TOpenApiMethod<GPaths, 'trace'>;
}

// MARK: - Method

function createOpenApiMethod<GPaths extends object, GMethod extends HttpMethod>(
	method: Uppercase<GMethod> & TRequestMethod
): TOpenApiMethod<GPaths, GMethod> {
	return function openApiMethod(
		this: TFetchClientBase,
		path: string,
		options: TFetchOptionsWithBody = {}
	) {
		return this.request(method, path, options);
	} as TOpenApiMethod<GPaths, GMethod>;
}

export interface TOpenApiMethod<GPaths extends object, GMethod extends HttpMethod> {
	<GPath extends TOpenApiPathWithMethod<GPaths, GMethod>, GParseAs extends TParseAs = 'json'>(
		path: GPath,
		...args: TOpenApiFetchOptionsArgs<
			TOpenApiFetchOptions<TOpenApiOperationForPath<GPaths, GMethod, GPath>, GParseAs> & {
				withResponse: true;
			}
		>
	): Promise<
		TOpenApiFetchResponse<TOpenApiOperationForPath<GPaths, GMethod, GPath>, GParseAs, true>
	>;
	<GPath extends TOpenApiPathWithMethod<GPaths, GMethod>, GParseAs extends TParseAs = 'json'>(
		path: GPath,
		...args: TOpenApiFetchOptionsArgs<
			TOpenApiFetchOptions<TOpenApiOperationForPath<GPaths, GMethod, GPath>, GParseAs> & {
				withResponse?: false;
			}
		>
	): Promise<TOpenApiFetchResponse<TOpenApiOperationForPath<GPaths, GMethod, GPath>, GParseAs>>;
	<
		GPath extends TOpenApiPathWithMethod<GPaths, GMethod>,
		GParseAs extends TParseAs = 'json',
		GWithResponse extends boolean = boolean
	>(
		path: GPath,
		...args: TOpenApiFetchOptionsArgs<
			TOpenApiFetchOptions<TOpenApiOperationForPath<GPaths, GMethod, GPath>, GParseAs> & {
				withResponse?: GWithResponse;
			}
		>
	): Promise<
		TOpenApiFetchResponse<TOpenApiOperationForPath<GPaths, GMethod, GPath>, GParseAs, GWithResponse>
	>;
}

type TOpenApiPathWithMethod<GPaths extends object, GMethod extends HttpMethod> = PathsWithMethod<
	GPaths,
	GMethod
> &
	string;

type TOpenApiOperationForPath<
	GPaths extends object,
	GMethod extends HttpMethod,
	GPath extends TOpenApiPathWithMethod<GPaths, GMethod>
> = FilterKeys<GPaths[GPath], GMethod>;

type TOpenApiFetchOptionsArgs<GOptions extends object> =
	RequiredKeysOf<GOptions> extends never ? [options?: GOptions] : [options: GOptions];

// MARK: - Options

export type TOpenApiFetchOptions<GOperation, GParseAs extends TParseAs = 'json'> = Omit<
	TFetchOptions<GParseAs>,
	| 'bodySerializer'
	| 'headers'
	| 'pathParams'
	| 'pathSerializer'
	| 'queryParams'
	| 'querySerializer'
	| 'withResponse'
> & {
	pathSerializer?: TPathSerializer<TOpenApiPathSerializerParams<GOperation>>;
	querySerializer?: TQuerySerializer<TOpenApiQuerySerializerParams<GOperation>>;
	bodySerializer?: TBodySerializer<TOpenApiRequestBody<GOperation>>;
} & TOpenApiPathParamsOption<GOperation> &
	TOpenApiQueryParamsOption<GOperation> &
	TOpenApiHeadersOption<GOperation> &
	TOpenApiRequestBodyOption<GOperation>;

// MARK: - Response

export type TOpenApiFetchResponse<
	GOperation,
	GParseAs extends TParseAs = 'json',
	GWithResponse extends boolean = false
> = TFetchResponse<
	TOpenApiSuccessResponse<GOperation, GParseAs>,
	TOpenApiErrorResponse<GOperation, GParseAs>,
	GParseAs,
	GWithResponse
>;

type TOpenApiSuccessResponse<GOperation, GParseAs extends TParseAs> = Readable<
	SuccessResponse<TOpenApiResponseMap<GOperation>, TOpenApiResponseMedia<GParseAs>>
>;

type TOpenApiErrorResponse<GOperation, GParseAs extends TParseAs> = Readable<
	ErrorResponse<TOpenApiResponseMap<GOperation>, TOpenApiResponseMedia<GParseAs>>
>;

type TOpenApiResponseMap<GOperation> =
	ResponseObjectMap<GOperation> extends Record<string | number, unknown>
		? ResponseObjectMap<GOperation>
		: Record<string | number, never>;

type TOpenApiResponseMedia<GParseAs extends TParseAs> = GParseAs extends 'json'
	? TOpenApiJsonMedia
	: MediaType;

type TOpenApiJsonMedia = `${string}/json` | `${string}/${string}+json`;

// MARK: - Request Body

type TOpenApiRequestBody<GOperation> = Writable<OperationRequestBodyContent<GOperation>>;

type TOpenApiRequestBodyOption<GOperation> = [TOpenApiRequestBody<GOperation>] extends [never]
	? { body?: never }
	: IsOperationRequestBodyOptional<GOperation> extends true
		? { body?: TOpenApiRequestBody<GOperation> }
		: { body: TOpenApiRequestBody<GOperation> };

// MARK: - Path Parameters

type TOpenApiPathParamsOption<GOperation> = [TOpenApiPathParams<GOperation>] extends [never]
	? { pathParams?: never }
	: TOpenApiHasRequiredPathParams<GOperation> extends true
		? { pathParams: TOpenApiPathParams<GOperation> }
		: { pathParams?: TOpenApiPathParams<GOperation> };

type TOpenApiPathParams<GOperation> = GOperation extends {
	parameters: { path?: infer GPathParams };
}
	? Extract<NonNullable<GPathParams>, Record<string, unknown>>
	: never;

type TOpenApiHasRequiredPathParams<GOperation> = GOperation extends {
	parameters: { path: unknown };
}
	? true
	: false;

type TOpenApiPathSerializerParams<GOperation> = [TOpenApiPathParams<GOperation>] extends [never]
	? Record<string, unknown>
	: TOpenApiPathParams<GOperation>;

// MARK: - Query Parameters

type TOpenApiQueryParamsOption<GOperation> = [TOpenApiQueryParams<GOperation>] extends [never]
	? { queryParams?: never }
	: TOpenApiHasRequiredQueryParams<GOperation> extends true
		? { queryParams: TOpenApiQueryParams<GOperation> }
		: { queryParams?: TOpenApiQueryParams<GOperation> };

type TOpenApiQueryParams<GOperation> = GOperation extends {
	parameters: { query?: infer GQueryParams };
}
	? Extract<NonNullable<GQueryParams>, Record<string, unknown>>
	: never;

type TOpenApiHasRequiredQueryParams<GOperation> = GOperation extends {
	parameters: { query: unknown };
}
	? true
	: false;

type TOpenApiQuerySerializerParams<GOperation> = [TOpenApiQueryParams<GOperation>] extends [never]
	? Record<string, unknown>
	: TOpenApiQueryParams<GOperation>;

// MARK: - Header Parameters

type TOpenApiHeadersOption<GOperation> = [TOpenApiHeaderParams<GOperation>] extends [never]
	? { headers?: TFetchHeadersInit }
	: TOpenApiHasRequiredHeaderParams<GOperation> extends true
		? { headers: TOpenApiHeaders<GOperation> }
		: { headers?: TOpenApiHeaders<GOperation> };

type TOpenApiHeaders<GOperation> = TOpenApiHeaderParams<GOperation> & TFetchHeadersInitRecord;

type TOpenApiHeaderParams<GOperation> = GOperation extends {
	parameters: { header?: infer GHeaderParams };
}
	? Extract<NonNullable<GHeaderParams>, Record<string, unknown>>
	: never;

type TOpenApiHasRequiredHeaderParams<GOperation> = GOperation extends {
	parameters: { header: unknown };
}
	? true
	: false;
