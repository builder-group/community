import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { type TOperationPathParams, type TOperationQueryParams } from '@blgc/types/openapi';
import type * as express from 'express';
import { createValidationContext, type TValidationError } from 'validation-adapter';
import { ValidationError } from '../../exceptions';
import { formatPath, parseParams } from '../../helper';
import {
	TOpenApiExpressFeature,
	TOpenApiExpressParsedData,
	TOpenApiExpressPathParams,
	TOpenApiExpressQueryParams,
	TParams,
	type TOpenApiExpressParamsParserOptions,
	type TOpenApiExpressRequest,
	type TOpenApiExpressValidators,
	type TOpenApiRouter
} from '../../types';

export function withExpress<GPaths extends object, GFeatures extends TFeatureDefinition[]>(
	baseRouter: TEnforceFeatureConstraint<TOpenApiRouter<GFeatures>, TOpenApiRouter<GFeatures>, []>,
	expressRouter: express.Router
): TOpenApiRouter<[TOpenApiExpressFeature<GPaths>, ...GFeatures]> {
	const expressFeature: TOpenApiExpressFeature<GPaths>['api'] = {
		_router: expressRouter,
		get(this: TOpenApiRouter<[TOpenApiExpressFeature<GPaths>]>, path, config) {
			this._router.get(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				...((config.middlewares as express.RequestHandler[]) ?? []),
				requestHandler(config.handler as express.RequestHandler)
			);
		},
		post(this: TOpenApiRouter<[TOpenApiExpressFeature<GPaths>]>, path, config) {
			this._router.post(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				...((config.middlewares as express.RequestHandler[]) ?? []),
				requestHandler(config.handler as express.RequestHandler)
			);
		},
		put(this: TOpenApiRouter<[TOpenApiExpressFeature<GPaths>]>, path, config) {
			this._router.put(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				...((config.middlewares as express.RequestHandler[]) ?? []),
				requestHandler(config.handler as express.RequestHandler)
			);
		},
		del(this: TOpenApiRouter<[TOpenApiExpressFeature<GPaths>]>, path, config) {
			this._router.delete(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				...((config.middlewares as express.RequestHandler[]) ?? []),
				requestHandler(config.handler as express.RequestHandler)
			);
		},
		patch(this: TOpenApiRouter<[TOpenApiExpressFeature<GPaths>]>, path, config) {
			this._router.patch(
				formatPath(path),
				parseParamsMiddleware(config),
				validationMiddleware(config),
				...((config.middlewares as express.RequestHandler[]) ?? []),
				requestHandler(config.handler as express.RequestHandler)
			);
		}
	};

	// Extend the base router with the express feature
	const extendedRouter = Object.assign(baseRouter, expressFeature) as TOpenApiRouter<
		[TOpenApiExpressFeature<GPaths>]
	>;
	extendedRouter._features.push('express');

	return extendedRouter as unknown as TOpenApiRouter<
		[TOpenApiExpressFeature<GPaths>, ...GFeatures]
	>;
}

function parseParamsMiddleware<GPathOperation>(
	paramsParser: TOpenApiExpressParamsParserOptions = {}
): express.RequestHandler {
	const {
		parseParams: shouldParseParams = true,
		parsePathParams = parseParams,
		parsePathParamsBlacklist,
		parseQueryParams = parseParams,
		parseQueryParamsBlacklist
	} = paramsParser;

	return (req, _res, next) => {
		if (shouldParseParams) {
			(req as TOpenApiExpressRequest<GPathOperation>).parsed = {
				query: parseQueryParams(
					req.query as TParams,
					parseQueryParamsBlacklist
				) as TOpenApiExpressQueryParams<GPathOperation>,
				params: parsePathParams(
					req.params as TParams,
					parsePathParamsBlacklist
				) as TOpenApiExpressPathParams<GPathOperation>
			} as TOpenApiExpressParsedData<GPathOperation>;
		}
		next();
	};
}

function validationMiddleware<GPathOperation>(
	validators: TOpenApiExpressValidators<GPathOperation>
): express.RequestHandler {
	const { bodyValidator, pathValidator, queryValidator } = validators;

	return async (req, _res, next) => {
		try {
			const validationErrors: TValidationError[] = [];

			if (bodyValidator != null) {
				const bodyValidationContext = createValidationContext(req.body);
				await bodyValidator.validate(bodyValidationContext);
				for (const error of bodyValidationContext.errors) {
					error['source'] = 'body';
					validationErrors.push(error);
				}
			}

			if (pathValidator != null) {
				const pathParams =
					(req as TOpenApiExpressRequest<GPathOperation>).parsed?.params ?? req.params;
				const pathValidationContext = createValidationContext<TOperationPathParams<GPathOperation>>(
					pathParams as TOperationPathParams<GPathOperation>
				);
				await pathValidator.validate(pathValidationContext);
				for (const error of pathValidationContext.errors) {
					error['source'] = 'path';
					validationErrors.push(error);
				}
			}

			if (queryValidator != null) {
				const queryParams =
					(req as TOpenApiExpressRequest<GPathOperation>).parsed?.query ?? req.query;
				const queryValidationContext = createValidationContext<
					TOperationQueryParams<GPathOperation>
				>(queryParams as TOperationQueryParams<GPathOperation>);
				await queryValidator.validate(queryValidationContext);
				for (const error of queryValidationContext.errors) {
					error['source'] = 'query';
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
	return async (req, res, next) => {
		try {
			await handler(req, res, next);
		} catch (error) {
			next(error);
		}
	};
}
