import type {
	TOperationPathParams,
	TOperationQueryParams,
	TRequestBody
} from '@blgc/types/openapi';

import type { TParserSchema } from './parser';

// =============================================================================
// Validation Schema
// =============================================================================

// Validation schema for query parameters
export type TOpenApiQueryParamsValidationSchema<GPathOperation> =
	undefined extends TOperationQueryParams<GPathOperation> // If the queryParams can be undefined/optional
		? { querySchema: Required<TParserSchema<TOperationQueryParams<GPathOperation> | undefined>> }
		: TOperationQueryParams<GPathOperation> extends never
			? { querySchema?: TBaseValidationSchemaEntry }
			: { querySchema: TParserSchema<TOperationQueryParams<GPathOperation>> };

// Validation schema for path parameters
export type TOpenApiPathParamsValidationSchema<GPathOperation> =
	undefined extends TOperationPathParams<GPathOperation> // If the pathParams can be undefined/optional
		? { pathSchema: TParserSchema<TOperationPathParams<GPathOperation> | undefined> }
		: TOperationPathParams<GPathOperation> extends never
			? { pathSchema?: TBaseValidationSchemaEntry }
			: { pathSchema: TParserSchema<TOperationPathParams<GPathOperation>> };

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
