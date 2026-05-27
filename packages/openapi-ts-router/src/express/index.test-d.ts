import type express from 'express';
import { describe, expectTypeOf, it } from 'vitest';
import type { components, paths } from '../__tests__/resources/mock-openapi-types';
import type { TOpenApiSchema } from '../index';
import { createExpressOpenApiRouter } from './index';

describe('createExpressOpenApiRouter function', () => {
	describe('route contracts', () => {
		it('should infer path params and response bodies from OpenAPI paths', () => {
			const router = createExpressOpenApiRouter<paths>({} as express.Router);

			router.get('/pet/{petId}', {
				pathSchema: {} as TOpenApiSchema<{ petId: number }>,
				middleware: [
					(req, _res, next) => {
						expectTypeOf(req.valid.path.petId).toEqualTypeOf<number>();
						next();
					}
				],
				handler: (req, res) => {
					expectTypeOf(req.valid.path.petId).toEqualTypeOf<number>();
					res.json({ name: 'Dog', photoUrls: [] });
				}
			});
		});

		it('should reject methods that are not declared for a path', () => {
			const router = createExpressOpenApiRouter<paths>({} as express.Router);

			// @ts-expect-error /store/inventory has no POST operation
			router.post('/store/inventory', {
				handler: () => undefined
			});
		});
	});

	describe('response bodies', () => {
		it('should reject invalid JSON response bodies', () => {
			const router = createExpressOpenApiRouter<paths>({} as express.Router);

			router.get('/pet/{petId}', {
				pathSchema: {} as TOpenApiSchema<{ petId: number }>,
				handler: (_req, res) => {
					// @ts-expect-error response body must match the OpenAPI success response.
					res.json('');
				}
			});
		});
	});

	describe('request schemas', () => {
		it('should infer optional query params without requiring a schema', () => {
			const router = createExpressOpenApiRouter<paths>({} as express.Router);

			router.get('/pet/findByTags', {
				handler: (req, res) => {
					expectTypeOf(req.valid.query.tags).toEqualTypeOf<string[] | undefined>();
					res.json([]);
				}
			});
		});

		it('should require schemas for required request parts', () => {
			const router = createExpressOpenApiRouter<paths>({} as express.Router);

			router.post('/pet', {
				bodySchema: {} as TOpenApiSchema<components['schemas']['Pet']>,
				handler: (req, res) => {
					expectTypeOf(req.valid.body.name).toEqualTypeOf<string>();
					res.json(req.valid.body);
				}
			});

			router.get(
				'/pet/{petId}',
				// @ts-expect-error pathSchema is required because the OpenAPI path has required params
				{
					handler: (_req, res) => {
						res.json({ name: 'Dog', photoUrls: [] });
					}
				}
			);

			router.post(
				'/pet',
				// @ts-expect-error bodySchema is required because the OpenAPI operation has a required body
				{
					handler: (_req, res) => {
						res.json({ name: 'Dog', photoUrls: [] });
					}
				}
			);
		});
	});
});
