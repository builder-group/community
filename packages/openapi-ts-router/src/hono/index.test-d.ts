import type { Hono } from 'hono';
import { describe, expectTypeOf, it } from 'vitest';
import type { components, paths } from '../__tests__/resources/mock-openapi-types';
import type { TOpenApiSchema } from './index';
import { createHonoOpenApiRouter } from './index';

describe('createHonoOpenApiRouter function', () => {
	describe('route contracts', () => {
		it('should infer path params and response bodies from OpenAPI paths', () => {
			const router = createHonoOpenApiRouter<paths>({} as Hono);

			router.get('/pet/{petId}', {
				pathSchema: {} as TOpenApiSchema<{ petId: number }>,
				middleware: [
					async (c, next) => {
						expectTypeOf(c.req.valid('param').petId).toEqualTypeOf<number>();
						await next();
					}
				],
				handler: (c) => {
					expectTypeOf(c.req.valid('param').petId).toEqualTypeOf<number>();
					return c.json({ name: 'Dog', photoUrls: [] });
				}
			});
		});

		it('should reject methods that are not declared for a path', () => {
			const router = createHonoOpenApiRouter<paths>({} as Hono);

			// @ts-expect-error /store/inventory has no POST operation
			router.post('/store/inventory', {
				handler: () => undefined
			});
		});
	});

	describe('response bodies', () => {
		it('should reject invalid JSON response bodies', () => {
			const router = createHonoOpenApiRouter<paths>({} as Hono);

			router.get('/pet/{petId}', {
				pathSchema: {} as TOpenApiSchema<{ petId: number }>,
				handler: (c) =>
					// @ts-expect-error response body must match the OpenAPI success response.
					c.json('')
			});
		});
	});

	describe('request schemas', () => {
		it('should infer JSON bodies from OpenAPI request bodies', () => {
			const router = createHonoOpenApiRouter<paths>({} as Hono);

			router.post('/pet', {
				bodySchema: {} as TOpenApiSchema<components['schemas']['Pet']>,
				handler: (c) => {
					expectTypeOf(c.req.valid('json').name).toEqualTypeOf<string>();
					return c.json(c.req.valid('json'));
				}
			});
		});

		it('should infer query params from OpenAPI operations', () => {
			const router = createHonoOpenApiRouter<paths>({} as Hono);

			router.get('/pet/findByTags', {
				querySchema: {} as TOpenApiSchema<{ tags?: string[] }>,
				handler: (c) => {
					expectTypeOf(c.req.valid('query').tags).toEqualTypeOf<string[] | undefined>();
					return c.json([]);
				}
			});
		});

		it('should require schemas for required request parts', () => {
			const router = createHonoOpenApiRouter<paths>({} as Hono);

			router.get(
				'/pet/{petId}',
				// @ts-expect-error pathSchema is required because the OpenAPI path has required params
				{
					handler: (c) => c.json({ name: 'Dog', photoUrls: [] })
				}
			);

			router.post(
				'/pet',
				// @ts-expect-error bodySchema is required because the OpenAPI operation has a required body
				{
					handler: (c) => c.json({ name: 'Dog', photoUrls: [] })
				}
			);
		});
	});
});
