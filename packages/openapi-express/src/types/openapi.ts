import type { TErrorStatus, THttpMethod, TMediaType, TOkStatus } from './api';

// =============================================================================
// Utility Types
// =============================================================================

// Filters keys from a type based on a set of matchers
export type TFilterKeys<GObject, GMatchers> = {
	[GKey in keyof GObject]: GKey extends GMatchers ? GObject[GKey] : never;
}[keyof GObject];

// =============================================================================
// API Path
// =============================================================================

// Retrieves paths that include a specific HTTP method
export type TPathsWith<GPaths, GHttpMethod extends THttpMethod> = {
	[GPath in keyof GPaths]: GPaths[GPath] extends { [GMethod in GHttpMethod]: any } ? GPath : never;
}[keyof GPaths];

// =============================================================================
// Request Parameters
// =============================================================================

// Extracts path parameters from a generic path type
export type TRequestPathParams<GPathOperation> = GPathOperation extends {
	parameters: { path?: any };
}
	? GPathOperation['parameters']['path']
	: never;

// Extracts query parameters from a generic path type
export type TRequestQueryParams<GPathOperation> = GPathOperation extends {
	parameters: { query?: any };
}
	? GPathOperation['parameters']['query']
	: never;

// =============================================================================
// Request Body
// =============================================================================

// Extracts request body from a generic path type
export type TRequestBodyObject<GPathOperation> = GPathOperation extends { requestBody?: any }
	? GPathOperation['requestBody']
	: never;

// Extracts the 'content' from the request body object
export type TRequestBodyContent<GPathOperation> =
	undefined extends TRequestBodyObject<GPathOperation>
		? TFilterKeys<NonNullable<TRequestBodyObject<GPathOperation>>, 'content'> | undefined
		: TFilterKeys<TRequestBodyObject<GPathOperation>, 'content'>;

// Extracts media content based on TMediaType from the request body content
export type TRequestBodyMedia<GPathOperation> =
	undefined extends TRequestBodyContent<GPathOperation>
		? TFilterKeys<NonNullable<TRequestBodyContent<GPathOperation>>, TMediaType> | undefined
		: TFilterKeys<TRequestBodyContent<GPathOperation>, TMediaType>;

export type TRequestBody<GPathOperation> = TRequestBodyMedia<GPathOperation>;

// =============================================================================
// Response Body
// =============================================================================

// Extracts successful response content for a given response type
export type TSuccessResponseContent<GResponse> = TFilterKeys<
	TFilterKeys<GResponse, TOkStatus>,
	'content'
>;

// Extracts error response content for a given response type
export type TErrorResponseContent<GResponse> = TFilterKeys<
	TFilterKeys<GResponse, TErrorStatus>,
	'content'
>;

// Extracts successful response body for a given response type
export type TSuccessResponseBody<GPathOperation> = GPathOperation extends { responses?: any }
	? NonNullable<TFilterKeys<TSuccessResponseContent<GPathOperation['responses']>, TMediaType>>
	: unknown;

// Extracts error response body for a given response type
export type TErrorResponseBody<GPathOperation> = GPathOperation extends { responses?: any }
	? NonNullable<TFilterKeys<TErrorResponseContent<GPathOperation['responses']>, TMediaType>>
	: unknown;
