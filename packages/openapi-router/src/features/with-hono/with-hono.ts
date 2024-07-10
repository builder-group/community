import { type Hono } from 'hono';
import type * as hono from 'hono/types';
import { createValidationContext, type TValidationError } from 'validation-adapter';
import { type TOperationPathParams, type TOperationQueryParams } from '@ibg/types/openapi';

import { ValidationError } from '../../exceptions';
import { formatPath, parseParams } from '../../helper';
import {
	type TEnforceFeatures,
	type TFeatureKeys,
	type TOpenApiHonoValidators,
	type TOpenApiRouter,
	type TSelectFeatures
} from '../../types';

export function withHono<
	GPaths extends object,
	GSelectedFeatureKeys extends TFeatureKeys[] = ['base']
>(
	router: TOpenApiRouter<TEnforceFeatures<GSelectedFeatureKeys, ['base']>, GPaths>,
	hono: Hono
): TOpenApiRouter<['hono', ...GSelectedFeatureKeys], GPaths> {
	const honoFeatures: TSelectFeatures<['hono'], GPaths> = {
		_hono: hono,
		get(this: TOpenApiRouter<['base', 'hono'], GPaths>, path, config) {
			this._hono.get(
				formatPath(path),
				parseParamsMiddleware(),
				validationMiddleware(config),
				config.handler
			);
		},
		post(this: TOpenApiRouter<['base', 'hono'], GPaths>, path, config) {
			this._hono.post(
				formatPath(path),
				parseParamsMiddleware(),
				validationMiddleware(config),
				config.handler
			);
		},
		put(this: TOpenApiRouter<['base', 'hono'], GPaths>, path, config) {
			this._hono.put(
				formatPath(path),
				parseParamsMiddleware(),
				validationMiddleware(config),
				config.handler
			);
		},
		del(this: TOpenApiRouter<['base', 'hono'], GPaths>, path, config) {
			this._hono.delete(
				formatPath(path),
				parseParamsMiddleware(),
				validationMiddleware(config),
				config.handler
			);
		}
	};

	// Merge existing features from the router with the new hono feature
	const _router = Object.assign(router, honoFeatures) as TOpenApiRouter<
		['hono', ...GSelectedFeatureKeys],
		GPaths
	>;
	_router._features.push('hono');

	return _router;
}

function parseParamsMiddleware(): hono.Handler {
	return async (c, next) => {
		// Extend Hono query params & path params parsing to handle numbers and booleans
		// as primitive type instead of string.
		c.req.addValidatedData('query', parseParams(c.req.query()));
		c.req.addValidatedData('param', parseParams(c.req.param()));

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
				error.source = 'body';
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
				error.source = 'path';
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
				error.source = 'query';
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
