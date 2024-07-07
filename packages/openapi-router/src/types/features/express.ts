import type express from 'express';
import type * as core from 'express-serve-static-core';
import {
	type TOperationPathParams,
	type TOperationQueryParams,
	type TOperationSuccessResponseContent,
	type TPathsWithMethod,
	type TRequestBody
} from '@ibg/types/openapi';
import { type TFilterKeys } from '@ibg/types/utils';

export interface TOpenApiExpressFeature<GPaths extends object> {
	get: TOpenApiExpressGet<GPaths>;
	put: TOpenApiExpressPut<GPaths>;
	post: TOpenApiExpressPost<GPaths>;
	del: TOpenApiExpressDelete<GPaths>;
}

export type TOpenApiExpressGet<GPaths extends object> = <
	GGetPaths extends TPathsWithMethod<GPaths, 'get'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'get'>
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	handler: TOpenApiExpressRequestHandler<GPathOperation>
) => void;

export type TOpenApiExpressPost<GPaths extends object> = <
	GGetPaths extends TPathsWithMethod<GPaths, 'post'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'post'>
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	handler: TOpenApiExpressRequestHandler<GPathOperation>
) => void;

export type TOpenApiExpressPut<GPaths extends object> = <
	GGetPaths extends TPathsWithMethod<GPaths, 'put'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'put'>
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	handler: TOpenApiExpressRequestHandler<GPathOperation>
) => void;

export type TOpenApiExpressDelete<GPaths extends object> = <
	GGetPaths extends TPathsWithMethod<GPaths, 'delete'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'delete'>
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	handler: TOpenApiExpressRequestHandler<GPathOperation>
) => void;

// =============================================================================
// Request Handler
// =============================================================================

export type TOpenApiExpressRequestHandler<GPathOperation> = (
	req: TOpenApiExpressRequest<GPathOperation>,
	res: TOpenApiExpressResponse<GPathOperation>,
	next: express.NextFunction
) => Promise<void> | void;

export type TOpenApiExpressRequest<GPathOperation> = express.Request<
	TOpenApiExpressPathParamsRequestOptions<GPathOperation>, // Params
	TOperationSuccessResponseContent<GPathOperation>, // ResBody
	TRequestBody<GPathOperation>, // ReqBody
	TOpenApiExpressQueryParamsRequestOptions<GPathOperation> // ReqQuery
>;

export type TOpenApiExpressQueryParamsRequestOptions<GPathOperation> =
	TOperationQueryParams<GPathOperation> extends never
		? core.Query
		: TOperationQueryParams<GPathOperation>;

export type TOpenApiExpressPathParamsRequestOptions<GPathOperation> =
	TOperationPathParams<GPathOperation> extends never
		? core.ParamsDictionary
		: TOperationPathParams<GPathOperation>;

export type TOpenApiExpressResponse<GPathOperation> = express.Response<
	TOperationSuccessResponseContent<GPathOperation> // ResBody
>;

// =============================================================================
// Validation
// =============================================================================
