import type * as express from 'express';
import { createValidateContext, type TValidationError } from 'validation-adapter';
import { type TOperationPathParams, type TOperationQueryParams } from '@ibg/types/openapi';

import { ValidationError } from '../../exceptions';
import {
	type TEnforceFeatures,
	type TFeatureKeys,
	type TOpenApiRouter,
	type TOpenApiValidationAdapters,
	type TSelectFeatures
} from '../../types';
import { formatPath, parseRequestQuery } from './helper';

export function withExpress<
	GPaths extends object,
	GSelectedFeatureKeys extends TFeatureKeys[] = ['base']
>(
	router: TOpenApiRouter<TEnforceFeatures<GSelectedFeatureKeys, ['base']>, GPaths>,
	expressRouter: express.Router
): TOpenApiRouter<['express', ...GSelectedFeatureKeys], GPaths> {
	const expressFeatures: TSelectFeatures<['express'], GPaths> = {
		_router: expressRouter,
		get(this: TOpenApiRouter<['base', 'express'], GPaths>, path, options, handler) {
			this._router.get(
				formatPath(path as string),
				validationMiddleware(options),
				requestHandler(handler as express.RequestHandler)
			);
		},
		post(this: TOpenApiRouter<['base', 'express'], GPaths>, path, options, handler) {
			this._router.post(
				formatPath(path as string),
				validationMiddleware(options),
				requestHandler(handler as express.RequestHandler)
			);
		},
		put(this: TOpenApiRouter<['base', 'express'], GPaths>, path, options, handler) {
			this._router.put(
				formatPath(path as string),
				validationMiddleware(options),
				requestHandler(handler as express.RequestHandler)
			);
		},
		del(this: TOpenApiRouter<['base', 'express'], GPaths>, path, options, handler) {
			this._router.delete(
				formatPath(path as string),
				validationMiddleware(options),
				requestHandler(handler as express.RequestHandler)
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

function validationMiddleware<GPathOperation>(
	validationAdapters: TOpenApiValidationAdapters<GPathOperation>
): express.RequestHandler {
	const { bodyAdapter, pathAdapter, queryAdapter } = validationAdapters;

	// eslint-disable-next-line @typescript-eslint/no-misused-promises -- async callback
	return async (req, _, next) => {
		try {
			const validationErrors: TValidationError[] = [];

			if (bodyAdapter != null) {
				const bodyValidationContext = createValidateContext(req.body);
				await bodyAdapter.validate(bodyValidationContext);
				validationErrors.push(...bodyValidationContext.errors);
			}

			if (pathAdapter != null) {
				const pathValidationContext = createValidateContext<TOperationPathParams<GPathOperation>>(
					req.params as any
				);
				await pathAdapter.validate(pathValidationContext);
				validationErrors.push(...pathValidationContext.errors);
			}

			if (queryAdapter != null) {
				const queryValidationContext = createValidateContext<TOperationQueryParams<GPathOperation>>(
					req.query as any
				);
				await queryAdapter.validate(queryValidationContext);
				validationErrors.push(...queryValidationContext.errors);
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
	return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
		try {
			// Parse query strings in the Express request object.
			// It expands the default query parser to handle advanced types like numbers and booleans.
			// https://expressjs.com/en/5x/api.html#req.query
			// https://github.com/ljharb/qs/issues/91
			req.query = parseRequestQuery(req.query) as any;

			// eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression -- RequestHandler can be async
			await handler(req, res, next);
		} catch (error) {
			next(error);
		}
	};
}
