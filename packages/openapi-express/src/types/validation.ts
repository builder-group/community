import type { TRequestBody, TRequestPathParams, TRequestQueryParams } from './openapi';
import type { TParserSchema } from './parser';

// =============================================================================
// Validation Schema
// =============================================================================

// Validation schema for query parameters
export type TOpenApiQueryParamsValidationSchema<GPathOperation> =
	undefined extends TRequestQueryParams<GPathOperation> // If the queryParams can be undefined/optional
		? { querySchema: Required<TParserSchema<TRequestQueryParams<GPathOperation> | undefined>> }
		: TRequestQueryParams<GPathOperation> extends never
		? { querySchema?: TBaseValidationSchemaEntry }
		: { querySchema: TParserSchema<TRequestQueryParams<GPathOperation>> };

// Validation schema for path parameters
export type TOpenApiPathParamsValidationSchema<GPathOperation> =
	undefined extends TRequestPathParams<GPathOperation> // If the pathParams can be undefined/optional
		? { pathSchema: TParserSchema<TRequestPathParams<GPathOperation> | undefined> }
		: TRequestPathParams<GPathOperation> extends never
		? { pathSchema?: TBaseValidationSchemaEntry }
		: { pathSchema: TParserSchema<TRequestPathParams<GPathOperation>> };

// Validation schema for body
export type TOpenApiBodyValidationSchema<GPathOperation> =
	undefined extends TRequestBody<GPathOperation> // If the body can be undefined/optional
		? { bodySchema: TParserSchema<TRequestBody<GPathOperation> | undefined> }
		: TRequestBody<GPathOperation> extends never
		? { bodySchema?: TBaseValidationSchemaEntry }
		: { bodySchema: TParserSchema<TRequestBody<GPathOperation>> };

export type TOpenApiValidationSchema<GPathOperation> =
	TOpenApiPathParamsValidationSchema<GPathOperation> &
		TOpenApiQueryParamsValidationSchema<GPathOperation> &
		TOpenApiBodyValidationSchema<GPathOperation>;

export interface TBaseValidationSchema {
	querySchema?: TBaseValidationSchemaEntry;
	pathSchema?: TBaseValidationSchemaEntry;
	bodySchema?: TBaseValidationSchemaEntry;
}

export type TBaseValidationSchemaEntry = Record<string, TParserSchema<any>>;
