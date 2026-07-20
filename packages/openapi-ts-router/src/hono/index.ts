import type { Context, Hono } from 'hono';
import type * as hono from 'hono/types';
import {
	formatOpenApiPath,
	OpenApiRouterError,
	OpenApiValidationError,
	parseParams,
	validateStandardSchema
} from 'openapi-ts-router';
import type {
	TCreateOpenApiRouterOptions,
	THttpMethod,
	TOpenApiMethodPath,
	TOpenApiParamParserOption,
	TOpenApiPathOperation,
	TOpenApiPathParams,
	TOpenApiQueryParams,
	TOpenApiRequestBody,
	TOpenApiRouteConfig,
	TOpenApiSuccessResponse,
	TOpenApiValidationIssue,
	TParseParamsInput
} from '../types';

export * from 'openapi-ts-router';

/**
 * Wraps a Hono app with methods typed from an OpenAPI `paths` object.
 * Pass `paths` from `openapi-typescript` as the generic argument.
 */
export function createHonoOpenApiRouter<GPaths extends object = object>(
	app: Hono,
	options: TCreateOpenApiRouterOptions = {}
): THonoOpenApiRouter<GPaths> {
	return {
		hono: app,
		get: createHonoOpenApiMethod<GPaths, 'get'>(app, 'get', options),
		post: createHonoOpenApiMethod<GPaths, 'post'>(app, 'post', options),
		put: createHonoOpenApiMethod<GPaths, 'put'>(app, 'put', options),
		patch: createHonoOpenApiMethod<GPaths, 'patch'>(app, 'patch', options),
		delete: createHonoOpenApiMethod<GPaths, 'delete'>(app, 'delete', options)
	};
}

/** Hono router wrapper returned by `createHonoOpenApiRouter()`. */
export interface THonoOpenApiRouter<GPaths extends object = object> {
	hono: Hono;
	get: THonoOpenApiMethod<GPaths, 'get'>;
	post: THonoOpenApiMethod<GPaths, 'post'>;
	put: THonoOpenApiMethod<GPaths, 'put'>;
	patch: THonoOpenApiMethod<GPaths, 'patch'>;
	delete: THonoOpenApiMethod<GPaths, 'delete'>;
}

// MARK: - Route Types

/**
 * Registers one Hono route checked against an OpenAPI operation.
 * Unsupported paths, methods, and missing required schemas fail at compile time.
 */
export type THonoOpenApiMethod<GPaths extends object, GMethod extends THttpMethod> = <
	GPath extends TOpenApiMethodPath<GPaths, GMethod>
>(
	path: GPath,
	config: THonoOpenApiRouteConfig<GPath, TOpenApiPathOperation<GPaths, GMethod, GPath>>
) => void;

/** Hono route config for one OpenAPI operation. */
export type THonoOpenApiRouteConfig<GPath extends string, GOperation> = TOpenApiRouteConfig<
	GOperation,
	THonoOpenApiRequestHandler<GPath, GOperation>,
	THonoOpenApiMiddlewareHandler<GPath, GOperation>
>;

/** Hono handler with typed `c.req.valid()` data and typed JSON success responses. */
export type THonoOpenApiRequestHandler<GPath extends string, GOperation> = hono.Handler<
	hono.Env,
	TOpenApiToHonoPath<GPath>,
	THonoOpenApiInput<GOperation>,
	THonoOpenApiResponse<GOperation>
>;

/** Hono middleware with typed `c.req.valid()` data. */
export type THonoOpenApiMiddlewareHandler<
	GPath extends string,
	GOperation
> = hono.MiddlewareHandler<hono.Env, TOpenApiToHonoPath<GPath>, THonoOpenApiInput<GOperation>>;

type TOpenApiToHonoPath<GPath extends string> =
	GPath extends `${infer GStart}{${infer GParam}}${infer GEnd}`
		? `${GStart}:${GParam}${TOpenApiToHonoPath<GEnd>}`
		: GPath;

/** Hono `c.req.valid()` input slots inferred from one OpenAPI operation. */
export type THonoOpenApiInput<GOperation> = THonoOpenApiQueryInput<GOperation> &
	THonoOpenApiPathInput<GOperation> &
	THonoOpenApiBodyInput<GOperation>;

type THonoOpenApiQueryInput<GOperation> = [TOpenApiQueryParams<GOperation>] extends [never]
	? Record<never, never>
	: {
			in: { query: TOpenApiQueryParams<GOperation> };
			out: { query: TOpenApiQueryParams<GOperation> };
		};

type THonoOpenApiPathInput<GOperation> = [TOpenApiPathParams<GOperation>] extends [never]
	? Record<never, never>
	: {
			in: { param: TOpenApiPathParams<GOperation> };
			out: { param: TOpenApiPathParams<GOperation> };
		};

type THonoOpenApiBodyInput<GOperation> = [TOpenApiRequestBody<GOperation>] extends [never]
	? Record<never, never>
	: {
			in: { json: TOpenApiRequestBody<GOperation> };
			out: { json: TOpenApiRequestBody<GOperation> };
		};

/** Hono response type whose JSON body is checked against the OpenAPI success response. */
export type THonoOpenApiResponse<GOperation> =
	| hono.TypedResponse<TOpenApiSuccessResponse<GOperation>>
	| Promise<hono.TypedResponse<TOpenApiSuccessResponse<GOperation>>>;

// MARK: - Route Registration

function createHonoOpenApiMethod<GPaths extends object, GMethod extends THttpMethod>(
	app: Hono,
	method: THonoRouteMethodName,
	options: TCreateOpenApiRouterOptions
): THonoOpenApiMethod<GPaths, GMethod> {
	return function honoOpenApiMethod(path, config) {
		const registerRoute = app[method] as THonoRouteRegister;
		registerRoute.call(
			app,
			formatOpenApiPath(path),
			createHonoParamsMiddleware({
				pathParamParser: config.pathParamParser ?? options.pathParamParser ?? parseParams,
				queryParamParser: config.queryParamParser ?? options.queryParamParser ?? parseParams
			}),
			createHonoValidationMiddleware(config),
			...(config.middleware ?? []),
			config.handler
		);
	} as THonoOpenApiMethod<GPaths, GMethod>;
}

type THonoRouteMethodName = 'delete' | 'get' | 'patch' | 'post' | 'put';

type THonoRouteRegister = (path: string, ...handlers: hono.Handler[]) => Hono;

// MARK: - Params

function createHonoParamsMiddleware(options: THonoParamsMiddlewareOptions): hono.Handler {
	const { pathParamParser, queryParamParser } = options;

	return async (c, next) => {
		const queryParams = getHonoQueryParams(c.req);
		c.req.addValidatedData(
			'query',
			queryParamParser !== false ? queryParamParser(queryParams) : queryParams
		);
		c.req.addValidatedData(
			'param',
			pathParamParser !== false ? pathParamParser(c.req.param()) : c.req.param()
		);
		await next();
	};
}

interface THonoParamsMiddlewareOptions {
	pathParamParser: TOpenApiParamParserOption;
	queryParamParser: TOpenApiParamParserOption;
}

interface THonoRequestWithValidatedData {
	addValidatedData(name: 'json' | 'param' | 'query', value: unknown): void;
	valid(name: 'json' | 'param' | 'query'): unknown;
	query(): Record<string, string>;
	queries(): Record<string, string[]>;
	param(): Record<string, string>;
}

// Note: req.query() flattens repeated keys; req.queries() preserves arrays before parsing
function getHonoQueryParams(req: THonoRequestWithValidatedData): TParseParamsInput {
	const queryParams: TParseParamsInput = { ...req.query() };
	for (const [key, values] of Object.entries(req.queries())) {
		queryParams[key] = values.length === 1 ? values[0] : values;
	}
	return queryParams;
}

// MARK: - Validation

function createHonoValidationMiddleware<GPath extends string, GOperation>(
	config: THonoOpenApiRouteConfig<GPath, GOperation>
): hono.Handler {
	const { bodySchema, pathSchema, querySchema } = config;

	return async (c, next) => {
		const issues: TOpenApiValidationIssue[] = [];
		const req = c.req as unknown as THonoRequestWithValidatedData;

		if (bodySchema != null) {
			const body = await parseJsonBody(c);
			const result = await validateStandardSchema(bodySchema, body, 'body');
			if (result.success) {
				req.addValidatedData('json', result.value);
			} else {
				issues.push(...result.issues);
			}
		}

		if (pathSchema != null) {
			const pathParams = req.valid('param') ?? req.param();
			const result = await validateStandardSchema(pathSchema, pathParams, 'path');
			if (result.success) {
				req.addValidatedData('param', result.value);
			} else {
				issues.push(...result.issues);
			}
		}

		if (querySchema != null) {
			const queryParams = req.valid('query') ?? getHonoQueryParams(req);
			const result = await validateStandardSchema(querySchema, queryParams, 'query');
			if (result.success) {
				req.addValidatedData('query', result.value);
			} else {
				issues.push(...result.issues);
			}
		}

		if (issues.length > 0) {
			throw new OpenApiValidationError(issues);
		}

		await next();
	};
}

async function parseJsonBody(c: Context): Promise<unknown> {
	try {
		return await c.req.json();
	} catch (error) {
		throw new OpenApiRouterError('#ERR_OPENAPI_PARSE_BODY', {
			message: 'Failed to parse request body as JSON.',
			cause: error,
			status: 400
		});
	}
}
