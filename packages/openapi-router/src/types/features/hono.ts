import {
	type TOperationPathParams,
	type TOperationQueryParams,
	type TOperationSuccessResponseContent,
	type TPathsWithMethod,
	type TRequestBody
} from '@blgc/types/openapi';
import { type TFilterKeys } from '@blgc/types/utils';
import type { Hono } from 'hono';
import type hono from 'hono/types';
import { type TValidator } from 'validation-adapter';

export interface TOpenApiHonoFeature<GPaths extends object> {
	_hono: Hono;
	get: TOpenApiHonoGet<GPaths>;
	put: TOpenApiHonoPut<GPaths>;
	post: TOpenApiHonoPost<GPaths>;
	del: TOpenApiHonoDelete<GPaths>;
}

export type TOpenApiHonoGet<GPaths extends object> = <
	GGetPath extends TPathsWithMethod<GPaths, 'get'>,
	GPathOperation extends TFilterKeys<GPaths[GGetPath], 'get'>
>(
	path: GGetPath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiHonoRouteConfig<GGetPath, GPathOperation>
) => void;

export type TOpenApiHonoPost<GPaths extends object> = <
	GPostPath extends TPathsWithMethod<GPaths, 'post'>,
	GPathOperation extends TFilterKeys<GPaths[GPostPath], 'post'>
>(
	path: GPostPath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiHonoRouteConfig<GPostPath, GPathOperation>
) => void;

export type TOpenApiHonoPut<GPaths extends object> = <
	GPutPath extends TPathsWithMethod<GPaths, 'put'>,
	GPathOperation extends TFilterKeys<GPaths[GPutPath], 'put'>
>(
	path: GPutPath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiHonoRouteConfig<GPutPath, GPathOperation>
) => void;

export type TOpenApiHonoDelete<GPaths extends object> = <
	GDeletePath extends TPathsWithMethod<GPaths, 'delete'>,
	GPathOperation extends TFilterKeys<GPaths[GDeletePath], 'delete'>
>(
	path: GDeletePath | (string & Record<never, never>), // https://github.com/microsoft/TypeScript/issues/29729
	config: TOpenApiHonoRouteConfig<GDeletePath, GPathOperation>
) => void;

// =============================================================================
// Request Handler
// =============================================================================

export type TOpenApiHonoRequestHandler<GPath extends string, GPathOperation> = hono.Handler<
	any,
	TOpenApiToHonoUrlPattern<GPath>,
	TOpenApiHonoInput<GPathOperation>,
	TOpenApiHonoResponse<GPathOperation>
>;

type TOpenApiToHonoUrlPattern<T extends string> =
	T extends `${infer Start}{${infer Param}}${infer End}` ? `${Start}:${Param}${End}` : T;

export type TOpenApiHonoInput<GPathOperation> = TOpenApiHonoQueryParams<GPathOperation> &
	TOpenApiHonoPathParams<GPathOperation> &
	TOpenApiHonoRequestBody<GPathOperation>;

export type TOpenApiHonoQueryParams<GPathOperation> =
	TOperationQueryParams<GPathOperation> extends never
		? {}
		: {
				in: { query: TOperationQueryParams<GPathOperation> };
				out: { query: TOperationQueryParams<GPathOperation> };
			};

export type TOpenApiHonoPathParams<GPathOperation> =
	TOperationPathParams<GPathOperation> extends never
		? {}
		: {
				in: { param: TOperationPathParams<GPathOperation> };
				out: { param: TOperationPathParams<GPathOperation> };
			};

export interface TOpenApiHonoRequestBody<GPathOperation> {
	in: { json: TRequestBody<GPathOperation> };
	out: { json: TRequestBody<GPathOperation> };
}

export type TOpenApiHonoResponse<GPathOperation> = hono.HandlerResponse<
	TOperationSuccessResponseContent<GPathOperation>
>;

// =============================================================================
// Router Options
// =============================================================================

export type TOpenApiHonoRouteConfig<GPath extends string, GPathOperation> = {
	handler: TOpenApiHonoRequestHandler<GPath, GPathOperation>;
} & TOpenApiHonoValidators<GPathOperation>;

// =============================================================================
// Validation
// =============================================================================

export type TOpenApiHonoValidators<GPathOperation> =
	TOpenApiHonoQueryParamsValidator<GPathOperation> &
		TOpenApiHonoPathParamsValidator<GPathOperation> &
		TOpenApiHonoBodyValidator<GPathOperation>;

export type TOpenApiHonoQueryParamsValidator<GPathOperation> =
	undefined extends TOperationQueryParams<GPathOperation> // If the queryValidator can be undefined/optional
		? { queryValidator?: TValidator<TOperationQueryParams<GPathOperation>> }
		: TOperationQueryParams<GPathOperation> extends never
			? { queryValidator?: TDefaultHonoValidator }
			: { queryValidator: TValidator<TOperationQueryParams<GPathOperation>> };

export type TOpenApiHonoPathParamsValidator<GPathOperation> =
	undefined extends TOperationPathParams<GPathOperation> // If the pathValidator can be undefined/optional
		? { pathValidator?: TValidator<TOperationPathParams<GPathOperation>> }
		: TOperationPathParams<GPathOperation> extends never
			? { pathValidator?: TDefaultHonoValidator }
			: { pathValidator: TValidator<TOperationPathParams<GPathOperation>> };

export type TOpenApiHonoBodyValidator<GPathOperation> =
	undefined extends TRequestBody<GPathOperation> // If the bodyValidator can be undefined/optional
		? { bodyValidator?: TValidator<TRequestBody<GPathOperation>> }
		: TRequestBody<GPathOperation> extends never
			? { bodyValidator?: TDefaultHonoValidator }
			: { bodyValidator: TValidator<TRequestBody<GPathOperation>> };

export type TDefaultHonoValidator = TValidator<Record<string, unknown>>;
