import type express from 'express';
import {
	formatOpenApiPath,
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
	TOpenApiValidationIssue
} from '../types';

export * from 'openapi-ts-router';

/**
 * Wraps an Express router with methods typed from an OpenAPI `paths` object.
 * Pass `paths` from `openapi-typescript` as the generic argument.
 * Body validation reads `req.body`, so mount `express.json()` or equivalent before these routes.
 */
export function createExpressOpenApiRouter<GPaths extends object = object>(
	router: express.Router,
	options: TCreateOpenApiRouterOptions = {}
): TExpressOpenApiRouter<GPaths> {
	return {
		router,
		get: createExpressOpenApiMethod<GPaths, 'get'>(router, 'get', options),
		post: createExpressOpenApiMethod<GPaths, 'post'>(router, 'post', options),
		put: createExpressOpenApiMethod<GPaths, 'put'>(router, 'put', options),
		patch: createExpressOpenApiMethod<GPaths, 'patch'>(router, 'patch', options),
		delete: createExpressOpenApiMethod<GPaths, 'delete'>(router, 'delete', options)
	};
}

/** Express router wrapper returned by `createExpressOpenApiRouter()`. */
export interface TExpressOpenApiRouter<GPaths extends object = object> {
	router: express.Router;
	get: TExpressOpenApiMethod<GPaths, 'get'>;
	post: TExpressOpenApiMethod<GPaths, 'post'>;
	put: TExpressOpenApiMethod<GPaths, 'put'>;
	patch: TExpressOpenApiMethod<GPaths, 'patch'>;
	delete: TExpressOpenApiMethod<GPaths, 'delete'>;
}

// MARK: - Route Types

/**
 * Registers one Express route checked against an OpenAPI operation.
 * Unsupported paths, methods, and missing required schemas fail at compile time.
 */
export type TExpressOpenApiMethod<GPaths extends object, GMethod extends THttpMethod> = <
	GPath extends TOpenApiMethodPath<GPaths, GMethod>
>(
	path: GPath,
	config: TExpressOpenApiRouteConfig<TOpenApiPathOperation<GPaths, GMethod, GPath>>
) => void;

/** Express route config for one OpenAPI operation. */
export type TExpressOpenApiRouteConfig<GOperation> = TOpenApiRouteConfig<
	GOperation,
	TExpressOpenApiRequestHandler<GOperation>,
	TExpressOpenApiMiddlewareHandler<GOperation>
>;

/** Express handler with typed `req.valid` data and typed JSON success responses. */
export type TExpressOpenApiRequestHandler<GOperation> = (
	req: TExpressOpenApiRequest<GOperation>,
	res: TExpressOpenApiResponse<GOperation>,
	next: express.NextFunction
) => Promise<void> | void;

/** Express middleware with typed `req.valid` data. */
export type TExpressOpenApiMiddlewareHandler<GOperation> = (
	req: TExpressOpenApiRequest<GOperation>,
	res: TExpressOpenApiResponse<GOperation>,
	next: express.NextFunction
) => Promise<void> | void;

/** Express request extended with validated OpenAPI request data. */
export type TExpressOpenApiRequest<GOperation> = express.Request<
	Record<string, string>,
	TOpenApiSuccessResponse<GOperation>,
	TOpenApiRequestBody<GOperation>,
	Record<string, unknown>
> & {
	/** Parsed and validated OpenAPI request data for route handlers. */
	// Note: Express 5 keeps req.query as a getter and resets req.params mutations,
	// so parsed and validated values live on req.valid
	valid: TExpressOpenApiValidatedData<GOperation>;
};

/** Validated request data exposed on `req.valid` after schema validation. */
export type TExpressOpenApiValidatedData<GOperation> = TExpressOpenApiValidatedPath<GOperation> &
	TExpressOpenApiValidatedQuery<GOperation> &
	TExpressOpenApiValidatedBody<GOperation>;

type TExpressOpenApiValidatedPath<GOperation> = [TOpenApiPathParams<GOperation>] extends [never]
	? { path?: never }
	: { path: TOpenApiPathParams<GOperation> };

type TExpressOpenApiValidatedQuery<GOperation> = [TOpenApiQueryParams<GOperation>] extends [never]
	? { query?: never }
	: { query: TOpenApiQueryParams<GOperation> };

type TExpressOpenApiValidatedBody<GOperation> = [TOpenApiRequestBody<GOperation>] extends [never]
	? { body?: never }
	: { body: TOpenApiRequestBody<GOperation> };

/** Express response whose `json()` body is typed from the OpenAPI success response. */
export type TExpressOpenApiResponse<GOperation> = express.Response<
	TOpenApiSuccessResponse<GOperation>,
	express.Locals
>;

// MARK: - Route Registration

function createExpressOpenApiMethod<GPaths extends object, GMethod extends THttpMethod>(
	router: express.Router,
	method: TExpressRouteMethodName,
	options: TCreateOpenApiRouterOptions
): TExpressOpenApiMethod<GPaths, GMethod> {
	return function expressOpenApiMethod(path, config) {
		const registerRoute = router[method] as TExpressRouteRegister;
		registerRoute.call(
			router,
			formatOpenApiPath(path),
			createExpressParamsMiddleware({
				pathParamParser: config.pathParamParser ?? options.pathParamParser ?? parseParams,
				queryParamParser: config.queryParamParser ?? options.queryParamParser ?? parseParams
			}),
			createExpressValidationMiddleware(config),
			...((config.middleware ?? []) as express.RequestHandler[]),
			config.handler as express.RequestHandler
		);
	} as TExpressOpenApiMethod<GPaths, GMethod>;
}

type TExpressRouteMethodName = 'delete' | 'get' | 'patch' | 'post' | 'put';

type TExpressRouteRegister = (
	path: string,
	...handlers: express.RequestHandler[]
) => express.Router;

// MARK: - Params

function createExpressParamsMiddleware(
	options: TExpressParamsMiddlewareOptions
): express.RequestHandler {
	const { pathParamParser, queryParamParser } = options;

	return (req, _res, next) => {
		const valid = getExpressOpenApiValid(req);
		valid.path = pathParamParser !== false ? pathParamParser(req.params) : req.params;
		valid.query = queryParamParser !== false ? queryParamParser(req.query) : req.query;
		next();
	};
}

interface TExpressParamsMiddlewareOptions {
	pathParamParser: TOpenApiParamParserOption;
	queryParamParser: TOpenApiParamParserOption;
}

function getExpressOpenApiValid(req: express.Request): TExpressOpenApiValidDataStore {
	const openApiRequest = req as express.Request & { valid?: TExpressOpenApiValidDataStore };
	openApiRequest.valid ??= {};
	return openApiRequest.valid;
}

interface TExpressOpenApiValidDataStore {
	body?: unknown;
	path?: unknown;
	query?: unknown;
}

// MARK: - Validation

function createExpressValidationMiddleware<GOperation>(
	config: TExpressOpenApiRouteConfig<GOperation>
): express.RequestHandler {
	const { bodySchema, pathSchema, querySchema } = config;

	return async (req, _res, next) => {
		const issues: TOpenApiValidationIssue[] = [];
		const valid = getExpressOpenApiValid(req);

		if (bodySchema != null) {
			const result = await validateStandardSchema(bodySchema, req.body, 'body');
			if (result.success) {
				valid.body = result.value;
			} else {
				issues.push(...result.issues);
			}
		}

		if (pathSchema != null) {
			const pathParams = valid.path ?? req.params;
			const result = await validateStandardSchema(pathSchema, pathParams, 'path');
			if (result.success) {
				valid.path = result.value;
			} else {
				issues.push(...result.issues);
			}
		}

		if (querySchema != null) {
			const queryParams = valid.query ?? req.query;
			const result = await validateStandardSchema(querySchema, queryParams, 'query');
			if (result.success) {
				valid.query = result.value;
			} else {
				issues.push(...result.issues);
			}
		}

		if (issues.length > 0) {
			throw new OpenApiValidationError(issues);
		}

		next();
	};
}
