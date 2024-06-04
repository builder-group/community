import type express from 'express';
import type * as core from 'express-serve-static-core';

import type {
	TRequestBody,
	TRequestPathParams,
	TRequestQueryParams,
	TSuccessResponseBody
} from './openapi';

// =============================================================================
// Request Options
// =============================================================================

// Request options for query parameters
export type TOpenApiQueryParamsRequestOptions<GPathOperation> =
	TRequestQueryParams<GPathOperation> extends never
		? core.Query
		: TRequestQueryParams<GPathOperation>;

// Request options for path parameters
export type TOpenApiPathParamsRequestOptions<GPathOperation> =
	TRequestPathParams<GPathOperation> extends never
		? core.ParamsDictionary
		: TRequestPathParams<GPathOperation>;

// =============================================================================
// Request
// =============================================================================

export type TOpenApiExpressRequest<GPathOperation> = express.Request<
	TOpenApiPathParamsRequestOptions<GPathOperation>, // Params
	TSuccessResponseBody<GPathOperation>, // ResBody
	TRequestBody<GPathOperation>, // ReqBody
	TOpenApiQueryParamsRequestOptions<GPathOperation> // ReqQuery
>;

// =============================================================================
// Response
// =============================================================================

export type TOpenApiExpressResponse<GPathOperation> = express.Response<
	TSuccessResponseBody<GPathOperation> // ResBody
>;

// =============================================================================
// Request Handler
// =============================================================================

export type TExpressRequestHandler<GPathOperation> = (
	req: TOpenApiExpressRequest<GPathOperation>,
	res: TOpenApiExpressResponse<GPathOperation>,
	next: express.NextFunction
) => Promise<void> | void;
