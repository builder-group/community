import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
	FilterKeys,
	HttpMethod,
	IsOperationRequestBodyOptional,
	MediaType,
	OperationRequestBodyContent,
	PathsWithMethod,
	Readable,
	RequiredKeysOf,
	ResponseObjectMap,
	SuccessResponse,
	Writable
} from 'openapi-typescript-helpers';

export type { HttpMethod, MediaType };

/** Configures default param parsing for every route registered through a router wrapper. */
export interface TCreateOpenApiRouterOptions {
	/** Default parser for path params. Set to `false` to keep raw router values. */
	pathParamParser?: TOpenApiParamParserOption;
	/** Default parser for query params. Set to `false` to keep raw router values. */
	queryParamParser?: TOpenApiParamParserOption;
}

/** Param parser or `false` to skip parsing before validation. */
export type TOpenApiParamParserOption = TParseParams | false;

/** Converts raw path or query params before Standard Schema validation runs. */
export type TParseParams = (params: TParseParamsInput) => Record<string, unknown>;

/** Recursive param object accepted by custom parsers and `parseParams()`. */
export interface TParseParamsInput {
	[key: string]: TParseParamsInputValue;
}

type TParseParamsInputValue =
	| undefined
	| string
	| TParseParamsInputValue[]
	| { [key: string]: TParseParamsInputValue };

// MARK: - Route

/** Extracts one operation from an OpenAPI `paths` map. */
export type TOpenApiPathOperation<
	GPaths extends object,
	GMethod extends HttpMethod,
	GPath extends TOpenApiMethodPath<GPaths, GMethod>
> = FilterKeys<GPaths[GPath], GMethod>;

/** Extracts route paths that support one HTTP method. */
// Note: Wrap PathsWithMethod because it preserves number keys from arbitrary path maps, but router paths are strings
export type TOpenApiMethodPath<GPaths extends object, GMethod extends HttpMethod> = Extract<
	PathsWithMethod<GPaths, GMethod>,
	string
>;

/**
 * Route config shared by Express and Hono adapters.
 * Required OpenAPI request parts require matching Standard Schema validators at compile time.
 */
export type TOpenApiRouteConfig<GOperation, GHandler, GMiddleware> = {
	/** Framework handler called after param parsing and validation succeed. */
	handler: GHandler;
	/** Framework middleware called after validation and before the handler. */
	middleware?: GMiddleware[];
	/** Overrides the router path parser. Set to `false` to keep raw router values. */
	pathParamParser?: TOpenApiParamParserOption;
	/** Overrides the router query parser. Set to `false` to keep raw router values. */
	queryParamParser?: TOpenApiParamParserOption;
} & TOpenApiPathSchemaOption<GOperation> &
	TOpenApiQuerySchemaOption<GOperation> &
	TOpenApiBodySchemaOption<GOperation>;

// MARK: - Validation

/** Standard Schema validator for one OpenAPI request part. */
export type TOpenApiSchema<GOutput> = StandardSchemaV1<unknown, GOutput>;

/** Validation issue reported by `OpenApiValidationError`. */
export interface TOpenApiValidationIssue {
	/** Request part that failed validation. */
	source: TOpenApiValidationSource;
	message: string;
	path?: TOpenApiValidationPath;
}

/** Request part checked by a route schema. */
export type TOpenApiValidationSource = 'body' | 'path' | 'query';

/** Validation path segments copied from Standard Schema issues. */
export type TOpenApiValidationPath = Array<PropertyKey>;

// MARK: - Responses

/** JSON success response body inferred from one OpenAPI operation. */
// Note: JSON-only for now; Readable removes OpenAPI writeOnly fields from response bodies
export type TOpenApiSuccessResponse<GOperation> = Readable<
	SuccessResponse<TOpenApiResponseMap<GOperation>, TOpenApiJsonMediaType>
>;

// Note: Wrap ResponseObjectMap because it falls back to unknown, but SuccessResponse requires a record
type TOpenApiResponseMap<GOperation> =
	ResponseObjectMap<GOperation> extends Record<string | number, unknown>
		? ResponseObjectMap<GOperation>
		: Record<string | number, never>;

type TOpenApiJsonMediaType = `${string}/json` | `${string}/${string}+json`;

// MARK: - Request Body

type TOpenApiBodySchemaOption<GOperation> = [TOpenApiRequestBody<GOperation>] extends [never]
	? { bodySchema?: never }
	: IsOperationRequestBodyOptional<GOperation> extends true
		? {
				/** Validates the JSON request body and exposes it to the handler. */
				bodySchema?: TOpenApiSchema<TOpenApiRequestBody<GOperation>>;
			}
		: {
				/** Validates the required JSON request body and exposes it to the handler. */
				bodySchema: TOpenApiSchema<TOpenApiRequestBody<GOperation>>;
			};

/** Writable JSON request body inferred from one OpenAPI operation. */
// Note: Wrap OperationRequestBodyContent to remove OpenAPI readOnly fields and map no-body operations from undefined to never
export type TOpenApiRequestBody<GOperation> = [
	NonNullable<OperationRequestBodyContent<GOperation>>
] extends [never]
	? never
	: Writable<OperationRequestBodyContent<GOperation>>;

// MARK: - Path Parameters

type TOpenApiPathSchemaOption<GOperation> = [TOpenApiPathParams<GOperation>] extends [never]
	? { pathSchema?: never }
	: RequiredKeysOf<TOpenApiPathParams<GOperation>> extends never
		? {
				/** Validates path params and exposes them to the handler. */
				pathSchema?: TOpenApiSchema<TOpenApiPathParams<GOperation>>;
			}
		: {
				/** Validates required path params and exposes them to the handler. */
				pathSchema: TOpenApiSchema<TOpenApiPathParams<GOperation>>;
			};

/** Path params inferred from one OpenAPI operation. */
export type TOpenApiPathParams<GOperation> = GOperation extends {
	parameters: { path?: infer GPathParams };
}
	? Extract<NonNullable<GPathParams>, Record<string, unknown>>
	: never;

// MARK: - Query Parameters

type TOpenApiQuerySchemaOption<GOperation> = [TOpenApiQueryParams<GOperation>] extends [never]
	? { querySchema?: never }
	: RequiredKeysOf<TOpenApiQueryParams<GOperation>> extends never
		? {
				/** Validates query params and exposes them to the handler. */
				querySchema?: TOpenApiSchema<TOpenApiQueryParams<GOperation>>;
			}
		: {
				/** Validates required query params and exposes them to the handler. */
				querySchema: TOpenApiSchema<TOpenApiQueryParams<GOperation>>;
			};

/** Query params inferred from one OpenAPI operation. */
export type TOpenApiQueryParams<GOperation> = GOperation extends {
	parameters: { query?: infer GQueryParams };
}
	? Extract<NonNullable<GQueryParams>, Record<string, unknown>>
	: never;
