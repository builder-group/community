import type express from 'express';

import { ValidationError, type TValidationErrorDetails } from './exceptions';
import { parseRequestQuery } from './helper';
import {
	isTParserCustomValidatorEsque,
	isTParserYupEsque,
	isTParserZodEsque,
	type TBaseValidationSchema,
	type TBaseValidationSchemaEntry,
	type TExpressRequestHandler,
	type TFilterKeys,
	type TOpenApiValidationSchema,
	type TPathsWith
} from './types';

export class OpenApiRouter<GPaths extends {} = {}> {
	private readonly router: express.Router;

	constructor(router: express.Router) {
		this.router = router;
	}

	public get<
		GGetPaths extends TPathsWith<GPaths, 'get'>,
		GPathOperation extends TFilterKeys<GPaths[GGetPaths], 'get'>
	>(
		path: GGetPaths | (string & Record<never, never>),
		validation: TOpenApiValidationSchema<GPathOperation>,
		handler: TExpressRequestHandler<GPathOperation>
	): void {
		this.router.get(
			this.formatPath(path as string),
			this.validationHandler(validation as TBaseValidationSchema),
			this.handlerWrapper(handler as express.RequestHandler)
		);
	}

	public post<
		GPostPaths extends TPathsWith<GPaths, 'post'>,
		GPathOperation extends TFilterKeys<GPaths[GPostPaths], 'post'>
	>(
		path: GPostPaths | (string & Record<never, never>),
		validation: TOpenApiValidationSchema<GPathOperation>,
		handler: TExpressRequestHandler<GPathOperation>
	): void {
		this.router.post(
			this.formatPath(path as string),
			this.validationHandler(validation as TBaseValidationSchema),
			this.handlerWrapper(handler as express.RequestHandler)
		);
	}

	public put<
		GPutPaths extends TPathsWith<GPaths, 'put'>,
		GPathOperation extends TFilterKeys<GPaths[GPutPaths], 'put'>
	>(
		path: GPutPaths | (string & Record<never, never>),
		validation: TOpenApiValidationSchema<GPathOperation>,
		handler: TExpressRequestHandler<GPathOperation>
	): void {
		this.router.put(
			this.formatPath(path as string),
			this.validationHandler(validation as TBaseValidationSchema),
			this.handlerWrapper(handler as express.RequestHandler)
		);
	}

	public del<
		GDeletePaths extends TPathsWith<GPaths, 'delete'>,
		GPathOperation extends TFilterKeys<GPaths[GDeletePaths], 'delete'>
	>(
		path: GDeletePaths | (string & Record<never, never>),
		validation: TOpenApiValidationSchema<GPathOperation>,
		handler: TExpressRequestHandler<GPathOperation>
	): void {
		this.router.delete(
			this.formatPath(path as string),
			this.validationHandler(validation as TBaseValidationSchema),
			this.handlerWrapper(handler as express.RequestHandler)
		);
	}

	public formatPath(path: string): string {
		// "/users/{userId}/books/{bookId}" -> "/users/:userId/books/:bookId"
		return path.replace(/\{(?<name>\w+)\}/g, ':$<name>');
	}

	public validationHandler(validationSchema: TBaseValidationSchema): express.RequestHandler {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Callback
		return async (req, res, next) => {
			try {
				// Validate each part of the request if a corresponding schema is provided
				const validationErrors = (
					await Promise.all(
						(['query', 'path', 'body'] as const).map(async (key) => {
							const schema = validationSchema[`${key}Schema`];
							if (schema != null) {
								return this.validateRequestPart(req[key], schema);
							}
							return [];
						})
					)
				).flat();

				// Check whether validation errors occured
				if (validationErrors.length > 0) {
					throw new ValidationError(validationErrors);
				}

				next();
			} catch (error) {
				next(error);
			}
		};
	}

	private async validateRequestPart(
		part: Record<string, unknown>,
		schema: TBaseValidationSchemaEntry
	): Promise<TValidationErrorDetails[]> {
		const errors: TValidationErrorDetails[] = [];

		for (const [key, validator] of Object.entries(schema)) {
			try {
				if (isTParserZodEsque(validator)) {
					validator.parse(part[key]);
				} else if (isTParserYupEsque(validator)) {
					validator.validateSync(part[key]);
				} else if (isTParserCustomValidatorEsque(validator)) {
					await validator(part[key]);
				}
			} catch (error) {
				if (error instanceof Error) {
					errors.push({ property: key, message: error.message, error });
				}
			}
		}

		return errors;
	}

	public handlerWrapper(handler: express.RequestHandler): express.RequestHandler {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Callback
		return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
			try {
				// Parse query strings in the Express request object.
				// It expands the default query parser to handle advanced types like numbers and booleans.
				// https://expressjs.com/en/5x/api.html#req.query
				// https://github.com/ljharb/qs/issues/91
				req.query = parseRequestQuery(req.query) as any;

				// eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression -- Express handler can be async
				await handler(req, res, next);
			} catch (error) {
				next(error);
			}
		};
	}
}
