/**
 * -----------------------------------------------------------------------------
 * This file includes code derived from the project openapi-ts/openapi-typescript by \@drwpow.
 * Project Repository: https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript-helpers/index.d.ts
 *
 * Date of Import: 05 June 2024
 * -----------------------------------------------------------------------------
 * The code included in this file is licensed under the MIT License,
 * as per the original project by \@drwpow.
 * For the license text, see: https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript-helpers/LICENSE
 * -----------------------------------------------------------------------------
 */

import type { TErrorStatus, THttpMethod, TMediaType, TOkStatus } from '../api';
import { type TFilterKeys } from '../utils';

/** Given an OpenAPI **Paths Object**, find all paths that have the given method */
export type TPathsWithMethod<GPaths, GHttpMethod extends THttpMethod> = {
	[GPath in keyof GPaths]: GPaths[GPath] extends { [GMethod in GHttpMethod]: any } ? GPath : never;
}[keyof GPaths];

/** Return first `parameters/path` from an operation object */
export type TOperationPathParams<GPathOperation> = GPathOperation extends {
	parameters: { path?: any };
}
	? NonNullable<GPathOperation['parameters']['path']>
	: never;

/** Return first `parameters/query` from an operation object */
export type TOperationQueryParams<GPathOperation> = GPathOperation extends {
	parameters: { query?: any };
}
	? NonNullable<GPathOperation['parameters']['query']>
	: never;

/** Return first `parameters/header` from an operation object */
export type TOperationHeader<GPathOperation> = GPathOperation extends {
	parameters: { header: any };
}
	? NonNullable<GPathOperation['parameters']['header']>
	: never;

/** Return first `parameters/cookie` from an operation object */
export type TOperationCookie<GPathOperation> = GPathOperation extends {
	parameters: { cookie: any };
}
	? NonNullable<GPathOperation['parameters']['cookie']>
	: never;

/** Return `content` for a Response Object */
export type TOperationContent<GObjectWithContent> = GObjectWithContent extends { content: any }
	? GObjectWithContent['content']
	: unknown;

/** Return first `responses` from an operation object */
export type TOperationResponses<GPathOperation> = GPathOperation extends { responses: any }
	? GPathOperation['responses']
	: never;

/** Return first `requestBody` from an operation object */
export type TOperationRequestBody<GPathOperation> = GPathOperation extends { requestBody?: any }
	? GPathOperation['requestBody']
	: never;

/** Return first `requestBody/content` from an operation object */
export type TOperationRequestBodyContent<GPathOperation> =
	undefined extends TOperationRequestBody<GPathOperation>
		? TOperationContent<NonNullable<TOperationRequestBody<GPathOperation>>> | undefined
		: TOperationContent<TOperationRequestBody<GPathOperation>>;

/** Return first `requestBody/content/{media-type}` from an operation object, allowing any media type */
export type TOperationRequestBodyMediaContent<
	GPathOperation,
	GMediaType extends TMediaType = TMediaType
> =
	TFilterKeys<TOperationRequestBodyContent<GPathOperation>, GMediaType> extends never
		? TFilterKeys<NonNullable<TOperationRequestBodyContent<GPathOperation>>, GMediaType> | undefined
		: TFilterKeys<TOperationRequestBodyContent<GPathOperation>, GMediaType>;

export type TRequestBody<GPathOperation> = TOperationRequestBodyMediaContent<GPathOperation>;

/** Return first 2XX response from a response object, allowing any media type  */
export type TSuccessResponseMediaContent<
	GResponse,
	GMediaType extends TMediaType = TMediaType
> = TFilterKeys<TOperationContent<TFilterKeys<GResponse, TOkStatus>>, GMediaType>;

/** Return first 5XX or 4XX response from a response object, allowing any media type  */
export type TErrorResponseMediaContent<
	GResponse,
	GMediaType extends TMediaType = TMediaType
> = TFilterKeys<TOperationContent<TFilterKeys<GResponse, TErrorStatus>>, GMediaType>;

/** Return first 2XX response from a operation object, allowing any media type  */
export type TOperationSuccessResponseContent<
	GPathOperation,
	GMediaType extends TMediaType = TMediaType
> = TSuccessResponseMediaContent<TOperationResponses<GPathOperation>, GMediaType>;

/** Return first 5XX or 4XX response from a operation object, allowing any media type  */
export type TOperationErrorResponseContent<
	GPathOperation,
	GMediaType extends TMediaType = TMediaType
> = TErrorResponseMediaContent<TOperationResponses<GPathOperation>, GMediaType>;
