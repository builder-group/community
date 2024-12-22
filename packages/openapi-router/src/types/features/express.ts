import {
	type TOperationPathParams,
	type TOperationQueryParams,
	type TOperationSuccessResponseContent,
	type TPathsWithMethod,
	type TRequestBody
} from '@blgc/types/openapi';
import { type TFilterKeys } from '@blgc/types/utils';
import type express from 'express';
import type * as core from 'express-serve-static-core';
import { type TValidator } from 'validation-adapter';
import { type TParseParams } from '../utils';

export interface TOpenApiExpressFeature<GPaths extends object> {
	_router: express.Router;
	get: TOpenApiExpressGet<GPaths>;
	put: TOpenApiExpressPut<GPaths>;
	post: TOpenApiExpressPost<GPaths>;
	del: TOpenApiExpressDelete<GPaths>;
	patch: TOpenApiExpressPatch<GPaths>;
}

export type TOpenApiExpressGet<GPaths extends object> = <
	GGetPath extends TPathsWithMethod<GPaths, 'get'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPath], 'get'>
>(
	path: GGetPath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiExpressRouteConfig<GPathOperation>
) => void;

export type TOpenApiExpressPost<GPaths extends object> = <
	GPostPath extends TPathsWithMethod<GPaths, 'post'>,
	GPathOperation extends TFilterKeys<GPaths[GPostPath], 'post'>
>(
	path: GPostPath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiExpressRouteConfig<GPathOperation>
) => void;

export type TOpenApiExpressPut<GPaths extends object> = <
	GPutPath extends TPathsWithMethod<GPaths, 'put'>,
	GPathOperation extends TFilterKeys<GPaths[GPutPath], 'put'>
>(
	path: GPutPath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiExpressRouteConfig<GPathOperation>
) => void;

export type TOpenApiExpressDelete<GPaths extends object> = <
	GDeletePath extends TPathsWithMethod<GPaths, 'delete'>,
	GPathOperation extends TFilterKeys<GPaths[GDeletePath], 'delete'>
>(
	path: GDeletePath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiExpressRouteConfig<GPathOperation>
) => void;

export type TOpenApiExpressPatch<GPaths extends object> = <
	GPatchPath extends TPathsWithMethod<GPaths, 'patch'>,
	GPathOperation extends TFilterKeys<GPaths[GPatchPath], 'patch'>
>(
	path: GPatchPath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
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
	TOpenApiExpressPathParams<GPathOperation>, // Params
	TOperationSuccessResponseContent<GPathOperation>, // ResBody
	TOpenApiExpressRequestBody<GPathOperation>, // ReqBody
	TOpenApiExpressQueryParams<GPathOperation> // ReqQuery
>;

export type TOpenApiExpressQueryParams<GPathOperation> =
	TOperationQueryParams<GPathOperation> extends never
		? core.Query
		: TOperationQueryParams<GPathOperation>;

export type TOpenApiExpressPathParams<GPathOperation> =
	TOperationPathParams<GPathOperation> extends never
		? core.ParamsDictionary
		: TOperationPathParams<GPathOperation>;

export type TOpenApiExpressRequestBody<GPathOperation> = TRequestBody<GPathOperation>;

export type TOpenApiExpressResponse<GPathOperation> = express.Response<
	TOperationSuccessResponseContent<GPathOperation>
>;

// =============================================================================
// Router Options
// =============================================================================

export type TOpenApiExpressRouteConfig<GPathOperation> = {
	handler: TOpenApiExpressRequestHandler<GPathOperation>;
} & TOpenApiExpressValidators<GPathOperation> &
	TOpenApiExpressParamsParserOptions;

// =============================================================================
// Validators
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

// =============================================================================
// Parsers
// =============================================================================

export interface TOpenApiExpressParamsParserOptions {
	parseParams?: boolean;
	parseQueryParams?: TParseParams;
	parseQueryParamsBlacklist?: string[];
	parsePathParams?: TParseParams;
	parsePathParamsBlacklist?: string[];
}
