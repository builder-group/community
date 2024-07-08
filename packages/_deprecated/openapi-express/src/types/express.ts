import type express from 'express';
import type * as core from 'express-serve-static-core';
import type {
	TOperationPathParams,
	TOperationQueryParams,
	TOperationSuccessResponseContent,
	TRequestBody
} from '@ibg/types/openapi';

// =============================================================================
// Request Options
// =============================================================================

// Request options for query parameters
export type TOpenApiQueryParamsRequestOptions<GPathOperation> =
	TOperationQueryParams<GPathOperation> extends never
		? core.Query
		: TOperationQueryParams<GPathOperation>;

// Request options for path parameters
export type TOpenApiPathParamsRequestOptions<GPathOperation> =
	TOperationPathParams<GPathOperation> extends never
		? core.ParamsDictionary
		: TOperationPathParams<GPathOperation>;

// =============================================================================
// Request
// =============================================================================

export type TOpenApiExpressRequest<GPathOperation> = express.Request<
	TOpenApiPathParamsRequestOptions<GPathOperation>, // Params
	TOperationSuccessResponseContent<GPathOperation>, // ResBody
	TRequestBody<GPathOperation>, // ReqBody
	TOpenApiQueryParamsRequestOptions<GPathOperation> // ReqQuery
>;

// =============================================================================
// Response
// =============================================================================

export type TOpenApiExpressResponse<GPathOperation> = express.Response<
	TOperationSuccessResponseContent<GPathOperation> // ResBody
>;

// =============================================================================
// Request Handler
// =============================================================================

export type TExpressRequestHandler<GPathOperation> = (
	req: TOpenApiExpressRequest<GPathOperation>,
	res: TOpenApiExpressResponse<GPathOperation>,
	next: express.NextFunction
) => Promise<void> | void;
