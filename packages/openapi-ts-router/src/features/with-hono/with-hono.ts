import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { type TOperationPathParams, type TOperationQueryParams } from '@blgc/types/openapi';
import { type Hono } from 'hono';
import type * as hono from 'hono/types';
import { createValidationContext, type TValidationError } from 'validation-adapter';
import { ValidationError } from '../../exceptions';
import { formatPath, parseParams } from '../../helper';
import {
	TOpenApiHonoFeature,
	type TOpenApiHonoParamsParserOptions,
	type TOpenApiHonoValidators,
	type TOpenApiRouter
} from '../../types';

export function withHono<GPaths extends object, GFeatures extends TFeatureDefinition[]>(
	router: TEnforceFeatureConstraint<TOpenApiRouter<GFeatures>, TOpenApiRouter<GFeatures>, []>,
	hono: Hono
): TOpenApiRouter<[TOpenApiHonoFeature<GPaths>, ...GFeatures]> {
	const honoFeatures: TOpenApiHonoFeature<GPaths>['api'] = {
		_hono: hono,
		get(this: TOpenApiRouter<[TOpenApiHonoFeature<GPaths>]>, path, config) {
			this._hono.get(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				config.handler
			);
		},
		post(this: TOpenApiRouter<[TOpenApiHonoFeature<GPaths>]>, path, config) {
			this._hono.post(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				config.handler
			);
		},
		put(this: TOpenApiRouter<[TOpenApiHonoFeature<GPaths>]>, path, config) {
			this._hono.put(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				config.handler
			);
		},
		del(this: TOpenApiRouter<[TOpenApiHonoFeature<GPaths>]>, path, config) {
			this._hono.delete(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				config.handler
			);
		},
		patch(this: TOpenApiRouter<[TOpenApiHonoFeature<GPaths>]>, path, config) {
			this._hono.patch(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				config.handler
			);
		}
	};

	// Merge existing features from the router with the new hono feature
	const _router = Object.assign(router, honoFeatures) as TOpenApiRouter<
		[TOpenApiHonoFeature<GPaths>]
	>;
	_router._features.push('hono');

	return _router as unknown as TOpenApiRouter<[TOpenApiHonoFeature<GPaths>, ...GFeatures]>;
}

function parseParamsMiddleware(paramsParser: TOpenApiHonoParamsParserOptions = {}): hono.Handler {
	const {
		parseParams: shouldParseParams = true,
		parsePathParams = parseParams,
		parsePathParamsBlacklist,
		parseQueryParams = parseParams,
		parseQueryParamsBlacklist
	} = paramsParser;
	return async (c, next) => {
		// Extend Hono query params & path params parsing to handle numbers and booleans
		// as primitive type instead of string.
		c.req.addValidatedData(
			'query',
			shouldParseParams ? parseQueryParams(c.req.query(), parseQueryParamsBlacklist) : c.req.query()
		);
		c.req.addValidatedData(
			'param',
			shouldParseParams ? parsePathParams(c.req.param(), parsePathParamsBlacklist) : c.req.param()
		);

		await next();
	};
}

function validationMiddleware<GPathOperation>(
	validators: TOpenApiHonoValidators<GPathOperation>
): hono.Handler<
	any,
	any,
	// Most likely set by 'parseParamsMiddleware()'
	{
		in: { query: Record<string, string> | undefined; param: Record<string, string> | undefined };
		out: { query: Record<string, string> | undefined; param: Record<string, string> | undefined };
	}
> {
	const { bodyValidator, pathValidator, queryValidator } = validators;

	return async (c, next) => {
		const validationErrors: TValidationError[] = [];

		if (bodyValidator != null) {
			const jsonBody = await c.req.json();
			const bodyValidationContext = createValidationContext(jsonBody);
			await bodyValidator.validate(bodyValidationContext);
			for (const error of bodyValidationContext.errors) {
				error['source'] = 'body';
				validationErrors.push(error);
			}
			if (bodyValidationContext.errors.length <= 0) {
				c.req.addValidatedData('json', jsonBody);
			}
		}

		if (pathValidator != null) {
			const pathParams = (c.req.valid('param') ??
				c.req.param()) as TOperationPathParams<GPathOperation>;
			const pathValidationContext =
				createValidationContext<TOperationPathParams<GPathOperation>>(pathParams);
			await pathValidator.validate(pathValidationContext);
			for (const error of pathValidationContext.errors) {
				error['source'] = 'path';
				validationErrors.push(error);
			}
			if (pathValidationContext.errors.length <= 0) {
				c.req.addValidatedData('param', pathParams);
			}
		}

		if (queryValidator != null) {
			const queryParams = (c.req.valid('query') ??
				c.req.query()) as TOperationQueryParams<GPathOperation>;
			const queryValidationContext =
				createValidationContext<TOperationQueryParams<GPathOperation>>(queryParams);
			await queryValidator.validate(queryValidationContext);
			for (const error of queryValidationContext.errors) {
				error['source'] = 'query';
				validationErrors.push(error);
			}
			if (queryValidationContext.errors.length <= 0) {
				c.req.addValidatedData('query', queryParams);
			}
		}

		if (validationErrors.length > 0) {
			throw new ValidationError(validationErrors);
		}

		await next();
	};
}
