import type { TParseAs } from './api';
import type {
	TBaseFetchOptions,
	TBodySerializer,
	TFetchResponse,
	TQuerySerializer
} from './client';
import type {
	TErrorResponseBody,
	TFilterKeys,
	TPathsWith,
	TRequestBody,
	TRequestPathParams,
	TRequestQueryParams,
	TSuccessResponseBody
} from './openapi';

// =============================================================================
// Fetch Response
// =============================================================================

export type TOpenApiFetchResponse<GPathOperation, GParseAs extends TParseAs> = TFetchResponse<
	TSuccessResponseBody<GPathOperation>,
	TErrorResponseBody<GPathOperation>,
	GParseAs
>;

// =============================================================================
// Fetch Options
// =============================================================================

// Fetch options for query parameters
export type TOpenApiQueryParamsFetchOptions<GPathOperation> =
	undefined extends TRequestQueryParams<GPathOperation> // If the queryParams can be undefined/optional
		? { queryParams?: TRequestQueryParams<GPathOperation> }
		: TRequestQueryParams<GPathOperation> extends never
		? { queryParams?: Record<string, unknown> }
		: { queryParams: TRequestQueryParams<GPathOperation> };

// Fetch options for path parameters
export type TOpenApiPathParamsFetchOptions<GPathOperation> =
	undefined extends TRequestPathParams<GPathOperation> // If the pathParams can be undefined/optional
		? { pathParams?: TRequestPathParams<GPathOperation> }
		: TRequestPathParams<GPathOperation> extends never
		? { pathParams?: Record<string, unknown> }
		: { pathParams: TRequestPathParams<GPathOperation> };

// Combines base fetch options with query and path parameters
export type TOpenApiFetchOptions<GPathOperation, GParseAs extends TParseAs> = {
	querySerializer?: TQuerySerializer<
		TRequestQueryParams<GPathOperation> extends never
			? Record<string, unknown>
			: TRequestQueryParams<GPathOperation>
	>;
	bodySerializer?: TBodySerializer<
		TRequestBody<GPathOperation> extends never ? unknown : TRequestBody<GPathOperation>
	>;
} & TBaseFetchOptions<GParseAs> &
	TOpenApiQueryParamsFetchOptions<GPathOperation> &
	TOpenApiPathParamsFetchOptions<GPathOperation>;

// =============================================================================
// API Request
// =============================================================================

export type TOpenApiGet<GPaths extends {}> = <
	GGetPaths extends TPathsWith<GPaths, 'get'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'get'>,
	GParseAs extends TParseAs = 'json'
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	options?: TOpenApiFetchOptions<GPathOperation, GParseAs>
) => Promise<TOpenApiFetchResponse<GPathOperation, GParseAs>>;

export type TOpenApiPost<GPaths extends {}> = <
	GPostPaths extends TPathsWith<GPaths, 'post'>,
	GPathOperation extends TFilterKeys<GPaths[GPostPaths], 'post'>,
	GParseAs extends TParseAs = 'json'
>(
	path: GPostPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	body: TRequestBody<
		'post' extends keyof GPaths[GPostPaths] ? GPaths[GPostPaths]['post'] : unknown
	> extends never
		? null
		: TRequestBody<'post' extends keyof GPaths[GPostPaths] ? GPaths[GPostPaths]['post'] : unknown>,
	options?: TOpenApiFetchOptions<GPathOperation, GParseAs>
) => Promise<TOpenApiFetchResponse<GPathOperation, GParseAs>>;

export type TOpenApiPut<GPaths extends {}> = <
	GPutPaths extends TPathsWith<GPaths, 'put'>,
	GPathOperation extends TFilterKeys<GPaths[GPutPaths], 'put'>,
	GParseAs extends TParseAs = 'json'
>(
	path: GPutPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	body: TRequestBody<
		'put' extends keyof GPaths[GPutPaths] ? GPaths[GPutPaths]['put'] : unknown
	> extends never
		? null
		: TRequestBody<'put' extends keyof GPaths[GPutPaths] ? GPaths[GPutPaths]['put'] : unknown>,
	options?: TOpenApiFetchOptions<GPathOperation, GParseAs>
) => Promise<TOpenApiFetchResponse<GPathOperation, GParseAs>>;

export type TOpenApiDelete<GPaths extends {}> = <
	GDeletePaths extends TPathsWith<GPaths, 'delete'>,
	GPathOperation extends TFilterKeys<GPaths[GDeletePaths], 'delete'>,
	GParseAs extends TParseAs = 'json'
>(
	path: GDeletePaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	options?: TOpenApiFetchOptions<GPathOperation, GParseAs>
) => Promise<TOpenApiFetchResponse<GPathOperation, GParseAs>>;

// =============================================================================
// OpenAPI Feature
// =============================================================================

export interface TOpenApiFeature<GPaths extends {}> {
	get: TOpenApiGet<GPaths>;
	put: TOpenApiPut<GPaths>;
	post: TOpenApiPost<GPaths>;
	del: TOpenApiDelete<GPaths>;
}
