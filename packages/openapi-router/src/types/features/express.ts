import type express from 'express';
import type * as core from 'express-serve-static-core';
import { type TValidator } from 'validation-adapter';
import {
	type TOperationPathParams,
	type TOperationQueryParams,
	type TOperationSuccessResponseContent,
	type TPathsWithMethod,
	type TRequestBody
} from '@ibg/types/openapi';
import { type TFilterKeys } from '@ibg/types/utils';

export interface TOpenApiExpressFeature<GPaths extends object> {
	_router: express.Router;
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
	config: TOpenApiExpressRouteConfig<GPathOperation>
) => void;

export type TOpenApiExpressPost<GPaths extends object> = <
	GGetPaths extends TPathsWithMethod<GPaths, 'post'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'post'>
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiExpressRouteConfig<GPathOperation>
) => void;

export type TOpenApiExpressPut<GPaths extends object> = <
	GGetPaths extends TPathsWithMethod<GPaths, 'put'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'put'>
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiExpressRouteConfig<GPathOperation>
) => void;

export type TOpenApiExpressDelete<GPaths extends object> = <
	GGetPaths extends TPathsWithMethod<GPaths, 'delete'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'delete'>
>(
	path: GGetPaths | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiExpressRouteConfig<GPathOperation>
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
// Router Options
// =============================================================================

export type TOpenApiExpressRouteConfig<GPathOperation> = {
	handler: TOpenApiExpressRequestHandler<GPathOperation>;
} & TOpenApiExpressValidators<GPathOperation>;

// =============================================================================
// Validation
// =============================================================================

export type TOpenApiExpressValidators<GPathOperation> =
	TOpenApiExpressQueryParamsValidator<GPathOperation> &
		TOpenApiExpressPathParamsValidator<GPathOperation> &
		TOpenApiExpressBodyValidator<GPathOperation>;

export type TOpenApiExpressQueryParamsValidator<GPathOperation> =
	undefined extends TOperationQueryParams<GPathOperation> // If the queryValidator can be undefined/optional
		? { queryValidator?: TValidator<TOperationQueryParams<GPathOperation>> }
		: TOperationQueryParams<GPathOperation> extends never
			? { queryValidator?: TDefaultExpressValidator }
			: { queryValidator: TValidator<TOperationQueryParams<GPathOperation>> };

export type TOpenApiExpressPathParamsValidator<GPathOperation> =
	undefined extends TOperationPathParams<GPathOperation> // If the pathValidator can be undefined/optional
		? { pathValidator?: TValidator<TOperationPathParams<GPathOperation>> }
		: TOperationPathParams<GPathOperation> extends never
			? { pathValidator?: TDefaultExpressValidator }
			: { pathValidator: TValidator<TOperationPathParams<GPathOperation>> };

export type TOpenApiExpressBodyValidator<GPathOperation> =
	undefined extends TRequestBody<GPathOperation> // If the bodyValidator can be undefined/optional
		? { bodyValidator?: TValidator<TRequestBody<GPathOperation>> }
		: TRequestBody<GPathOperation> extends never
			? { bodyValidator?: TDefaultExpressValidator }
			: { bodyValidator: TValidator<TRequestBody<GPathOperation>> };

export type TDefaultExpressValidator = TValidator<Record<string, unknown>>;
