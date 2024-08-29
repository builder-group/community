import type * as express from 'express';
import { type ParamsDictionary } from 'express-serve-static-core';
import { createValidationContext, type TValidationError } from 'validation-adapter';
import { type TOperationPathParams, type TOperationQueryParams } from '@blgc/types/openapi';

import { ValidationError } from '../../exceptions';
import { formatPath, parseParams } from '../../helper';
import {
	type TEnforceFeatures,
	type TFeatureKeys,
	type TOpenApiExpressParamsParsers,
	type TOpenApiExpressValidators,
	type TOpenApiRouter,
	type TParams,
	type TSelectFeatures
} from '../../types';

export function withExpress<
	GPaths extends object,
	GSelectedFeatureKeys extends TFeatureKeys[] = ['base']
>(
	router: TOpenApiRouter<TEnforceFeatures<GSelectedFeatureKeys, ['base']>, GPaths>,
	expressRouter: express.Router
): TOpenApiRouter<['express', ...GSelectedFeatureKeys], GPaths> {
	const expressFeatures: TSelectFeatures<['express'], GPaths> = {
		_router: expressRouter,
		get(this: TOpenApiRouter<['base', 'express'], GPaths>, path, config) {
			this._router.get(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				requestHandler(config.handler as express.RequestHandler)
			);
		},
		post(this: TOpenApiRouter<['base', 'express'], GPaths>, path, config) {
			this._router.post(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				requestHandler(config.handler as express.RequestHandler)
			);
		},
		put(this: TOpenApiRouter<['base', 'express'], GPaths>, path, config) {
			this._router.put(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				requestHandler(config.handler as express.RequestHandler)
			);
		},
		del(this: TOpenApiRouter<['base', 'express'], GPaths>, path, config) {
			this._router.delete(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				requestHandler(config.handler as express.RequestHandler)
			);
		}
	};

	// Merge existing features from the router with the new express feature
	const _router = Object.assign(router, expressFeatures) as TOpenApiRouter<
		['express', ...GSelectedFeatureKeys],
		GPaths
	>;
	_router._features.push('express');

	return _router;
}

function parseParamsMiddleware(
	paramsParser: TOpenApiExpressParamsParsers = {}
): express.RequestHandler {
	const {
		parseParams: shouldParseParams = true,
		parsePathParams = parseParams,
		parseQueryParams = parseParams
	} = paramsParser;

	if (shouldParseParams) {
		return (req, _res, next) => {
			// Extend Express query params & path params parsing to handle numbers and booleans
			// as primitive type instead of string.
			// See: https://expressjs.com/en/5x/api.html#req.query
			//      https://github.com/ljharb/qs/issues/91
			req.query = parseQueryParams(req.query) as TParams;
			req.params = parsePathParams(req.params) as ParamsDictionary;

			next();
		};
	}

	return (_req, _res, next) => {
		next();
	};
}

function validationMiddleware<GPathOperation>(
	validators: TOpenApiExpressValidators<GPathOperation>
): express.RequestHandler {
	const { bodyValidator, pathValidator, queryValidator } = validators;

	// eslint-disable-next-line @typescript-eslint/no-misused-promises -- async callback
	return async (req, _res, next) => {
		try {
			const validationErrors: TValidationError[] = [];

			if (bodyValidator != null) {
				const bodyValidationContext = createValidationContext(req.body);
				await bodyValidator.validate(bodyValidationContext);
				for (const error of bodyValidationContext.errors) {
					error.source = 'body';
					validationErrors.push(error);
				}
			}

			if (pathValidator != null) {
				const pathValidationContext = createValidationContext<TOperationPathParams<GPathOperation>>(
					req.params as TOperationPathParams<GPathOperation>
				);
				await pathValidator.validate(pathValidationContext);
				for (const error of pathValidationContext.errors) {
					error.source = 'path';
					validationErrors.push(error);
				}
			}

			if (queryValidator != null) {
				const queryValidationContext = createValidationContext<
					TOperationQueryParams<GPathOperation>
				>(req.query as TOperationQueryParams<GPathOperation>);
				await queryValidator.validate(queryValidationContext);
				for (const error of queryValidationContext.errors) {
					error.source = 'query';
					validationErrors.push(error);
				}
			}

			if (validationErrors.length > 0) {
				throw new ValidationError(validationErrors);
			}

			next();
		} catch (error) {
			next(error);
		}
	};
}

function requestHandler(handler: express.RequestHandler): express.RequestHandler {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises -- async callback
	return async (req, res, next) => {
		try {
			// eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression -- RequestHandler can be async
			await handler(req, res, next);
		} catch (error) {
			next(error);
		}
	};
}
