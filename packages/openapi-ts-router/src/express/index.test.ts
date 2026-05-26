import type { StandardSchemaV1 } from '@standard-schema/spec';
import type express from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { paths } from '../__tests__/resources/mock-openapi-types';
import { OpenApiValidationError } from '../errors';
import { createExpressOpenApiRouter } from './index';

describe('createExpressOpenApiRouter function', () => {
	it('should register formatted routes and expose parsed values to handlers', async () => {
		// Prepare
		const { registeredRoutes, router } = createTestExpressRouter();
		const openApiRouter = createExpressOpenApiRouter<paths>(router);
		const responseJson = vi.fn();

		openApiRouter.get('/pet/{petId}', {
			pathSchema: createStandardSchema<{ petId: number }>((value) => ({
				value: value as { petId: number }
			})),
			middleware: [
				(req, _res, next) => {
					expect(req.valid.path.petId).toBe(123);
					next();
				}
			],
			handler: (req, res) => {
				expect(req.valid.path.petId).toBe(123);
				res.json({ name: 'Dog', photoUrls: [] });
			}
		});

		const route = registeredRoutes[0];
		const req = createExpressRequest({ params: { petId: '123' } });
		const res = createExpressResponse({ json: responseJson });

		// Act
		await runExpressHandlers(route?.handlers ?? [], req, res);

		// Assert
		expect(route?.path).toBe('/pet/:petId');
		expect(responseJson).toHaveBeenCalledWith({ name: 'Dog', photoUrls: [] });
	});

	it('should reject validation errors from middleware', async () => {
		// Prepare
		const { registeredRoutes, router } = createTestExpressRouter();
		const openApiRouter = createExpressOpenApiRouter<paths>(router);

		openApiRouter.get('/pet/{petId}', {
			pathSchema: createStandardSchema(() => ({
				issues: [{ message: 'Invalid pet id', path: [{ key: 'petId' }] }]
			})),
			handler: () => undefined
		});

		const req = createExpressRequest({ params: { petId: 'abc' } });

		// Act / Assert
		await expect(
			runExpressHandlers(registeredRoutes[0]?.handlers ?? [], req)
		).rejects.toBeInstanceOf(OpenApiValidationError);
	});

	it('should let schemas handle raw path params when router path parsing is disabled', async () => {
		// Prepare
		const { registeredRoutes, router } = createTestExpressRouter();
		const openApiRouter = createExpressOpenApiRouter<paths>(router, {
			pathParamParser: false
		});

		openApiRouter.get('/pet/{petId}', {
			pathSchema: createStandardSchema<{ petId: number }>((value) => {
				expect(value).toEqual({ petId: '123' });
				return { value: { petId: 123 } };
			}),
			handler: (req, res) => {
				expect(req.valid.path.petId).toBe(123);
				res.json({ name: 'Dog', photoUrls: [] });
			}
		});

		const req = createExpressRequest({ params: { petId: '123' } });
		const responseJson = vi.fn();
		const res = createExpressResponse({ json: responseJson });

		// Act
		await runExpressHandlers(registeredRoutes[0]?.handlers ?? [], req, res);

		// Assert
		expect(responseJson).toHaveBeenCalledWith({ name: 'Dog', photoUrls: [] });
	});

	it('should preserve repeated query params before validation', async () => {
		// Prepare
		const { registeredRoutes, router } = createTestExpressRouter();
		const openApiRouter = createExpressOpenApiRouter<paths>(router);
		const responseJson = vi.fn();

		openApiRouter.get('/pet/findByTags', {
			querySchema: createStandardSchema<{ tags: string[] }>((value) => {
				expect(value).toEqual({ tags: ['dog', 'cat'] });
				return { value: { tags: ['dog', 'cat'] } };
			}),
			handler: (req, res) => {
				expect(req.valid.query.tags).toEqual(['dog', 'cat']);
				res.json([]);
			}
		});

		const req = createExpressRequest({ query: { tags: ['dog', 'cat'] } });
		const res = createExpressResponse({ json: responseJson });

		// Act
		await runExpressHandlers(registeredRoutes[0]?.handlers ?? [], req, res);

		// Assert
		expect(responseJson).toHaveBeenCalledWith([]);
	});
});

interface TRegisteredRoute {
	path: string;
	handlers: express.RequestHandler[];
}

interface TExpressRequestOptions {
	body?: unknown;
	params?: Record<string, string>;
	query?: express.Request['query'];
}

function createExpressRequest(options: TExpressRequestOptions = {}): express.Request {
	return {
		body: options.body,
		params: options.params ?? {},
		query: options.query ?? {}
	} as unknown as express.Request;
}

interface TExpressResponseOptions {
	json?: express.Response['json'];
}

function createExpressResponse(options: TExpressResponseOptions = {}): express.Response {
	return {
		json: options.json ?? vi.fn()
	} as unknown as express.Response;
}

function createTestExpressRouter(): {
	router: express.Router;
	registeredRoutes: TRegisteredRoute[];
} {
	const registeredRoutes: TRegisteredRoute[] = [];
	const router = {
		get(path: string, ...handlers: express.RequestHandler[]) {
			registeredRoutes.push({ path, handlers });
			return router;
		}
	};

	return {
		router: router as unknown as express.Router,
		registeredRoutes
	};
}

async function runExpressHandlers(
	handlers: express.RequestHandler[],
	req: express.Request,
	res = createExpressResponse()
): Promise<void> {
	let index = -1;

	await runNext();

	async function runNext(error?: unknown): Promise<void> {
		if (error != null) {
			throw error;
		}

		index += 1;
		const handler = handlers[index];
		if (handler == null) {
			return;
		}

		let nextPromise: Promise<void> | null = null;
		const next: express.NextFunction = (nextError) => {
			nextPromise = runNext(nextError);
		};

		await handler(req, res, next);

		if (nextPromise != null) {
			await nextPromise;
		}
	}
}

function createStandardSchema<GOutput>(
	validate: (value: unknown) => StandardSchemaV1.Result<GOutput>
): StandardSchemaV1<unknown, GOutput> {
	return {
		'~standard': {
			version: 1,
			vendor: 'test',
			validate
		}
	};
}
