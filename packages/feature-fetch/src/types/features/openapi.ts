import type {
	TOperationErrorResponseContent,
	TOperationPathParams,
	TOperationQueryParams,
	TOperationSuccessResponseContent,
	TPathsWithMethod,
	TRequestBody
} from '@ibg/types/openapi';
import { type TFilterKeys } from '@ibg/types/utils';

import { type TParseAs } from '../fetch';
import type {
	TBodySerializer,
	TFetchOptions,
	TFetchResponse,
	TPathSerializer,
	TQuerySerializer
} from '../fetch-client';

export interface TOpenApiFeature<GPaths extends object> {
	get: TOpenApiGet<GPaths>;
	put: TOpenApiPut<GPaths>;
	post: TOpenApiPost<GPaths>;
	del: TOpenApiDelete<GPaths>;
}

export type TOpenApiGet<GPaths extends object> = <
	GGetPaths extends TPathsWithMethod<GPaths, 'get'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'get'>,
	GParseAs extends TParseAs = 'json'
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	options?: TOpenApiFetchOptions<GPathOperation, GParseAs>
) => Promise<TOpenApiFetchResponse<GPathOperation, GParseAs>>;

export type TOpenApiPost<GPaths extends object> = <
	GPostPaths extends TPathsWithMethod<GPaths, 'post'>,
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

export type TOpenApiPut<GPaths extends object> = <
	GPutPaths extends TPathsWithMethod<GPaths, 'put'>,
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

export type TOpenApiDelete<GPaths extends object> = <
	GDeletePaths extends TPathsWithMethod<GPaths, 'delete'>,
	GPathOperation extends TFilterKeys<GPaths[GDeletePaths], 'delete'>,
	GParseAs extends TParseAs = 'json'
>(
	path: GDeletePaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	options?: TOpenApiFetchOptions<GPathOperation, GParseAs>
) => Promise<TOpenApiFetchResponse<GPathOperation, GParseAs>>;

// =============================================================================
// Fetch Response
// =============================================================================

export type TOpenApiFetchResponse<GPathOperation, GParseAs extends TParseAs> = TFetchResponse<
	TOperationSuccessResponseContent<GPathOperation>,
	TOperationErrorResponseContent<GPathOperation>,
	GParseAs
>;

// =============================================================================
// Fetch Options
// =============================================================================

// Fetch options for query parameters
export type TOpenApiQueryParamsFetchOptions<GPathOperation> =
	undefined extends TOperationQueryParams<GPathOperation> // If the queryParams can be undefined/optional
		? { queryParams?: TOperationQueryParams<GPathOperation> }
		: TOperationQueryParams<GPathOperation> extends never
			? { queryParams?: Record<string, unknown> }
			: { queryParams: TOperationQueryParams<GPathOperation> };

// Fetch options for path parameters
export type TOpenApiPathParamsFetchOptions<GPathOperation> =
	undefined extends TOperationPathParams<GPathOperation> // If the pathParams can be undefined/optional
		? { pathParams?: TOperationPathParams<GPathOperation> }
		: TOperationPathParams<GPathOperation> extends never
			? { pathParams?: Record<string, unknown> }
			: { pathParams: TOperationPathParams<GPathOperation> };

export type TOpenApiFetchOptions<GPathOperation, GParseAs extends TParseAs> = {
	pathSerializer?: TPathSerializer<
		TOperationPathParams<GPathOperation> extends never
			? Record<string, unknown>
			: TOperationPathParams<GPathOperation>
	>;
	querySerializer?: TQuerySerializer<
		TOperationQueryParams<GPathOperation> extends never
			? Record<string, unknown>
			: TOperationQueryParams<GPathOperation>
	>;
	bodySerializer?: TBodySerializer<
		TRequestBody<GPathOperation> extends never ? unknown : TRequestBody<GPathOperation>
	>;
} & Omit<
	TFetchOptions<GParseAs>,
	'pathSerializer' | 'querySerializer' | 'bodySerializer' | 'pathParams' | 'queryParams'
> &
	TOpenApiQueryParamsFetchOptions<GPathOperation> &
	TOpenApiPathParamsFetchOptions<GPathOperation>;
