import type { StandardSchemaV1 } from '@standard-schema/spec';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { paths } from '../__tests__/resources/mock-openapi-types';
import { createHonoOpenApiRouter } from './index';

describe('createHonoOpenApiRouter function', () => {
	it('should register formatted routes and expose parsed params to handlers', async () => {
		// Prepare
		const app = new Hono();
		const openApiRouter = createHonoOpenApiRouter<paths>(app);

		openApiRouter.get('/pet/{petId}', {
			pathSchema: createStandardSchema<{ petId: number }>((value) => ({
				value: value as { petId: number }
			})),
			middleware: [
				async (c, next) => {
					expect(c.req.valid('param').petId).toBe(123);
					await next();
				}
			],
			handler: (c) => {
				expect(c.req.valid('param').petId).toBe(123);
				return c.json({ name: 'Dog', photoUrls: [] });
			}
		});

		// Act
		const response = await app.request('/pet/123');

		// Assert
		await expect(response.json()).resolves.toEqual({ name: 'Dog', photoUrls: [] });
	});

	it('should validate JSON bodies with Standard Schema', async () => {
		// Prepare
		const app = new Hono();
		const openApiRouter = createHonoOpenApiRouter<paths>(app);

		openApiRouter.post('/pet', {
			bodySchema: createStandardSchema<{ name: string; photoUrls: string[] }>((value) => ({
				value: value as { name: string; photoUrls: string[] }
			})),
			handler: (c) => c.json(c.req.valid('json'))
		});

		// Act
		const response = await app.request('/pet', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Dog', photoUrls: [] })
		});

		// Assert
		await expect(response.json()).resolves.toEqual({ name: 'Dog', photoUrls: [] });
	});

	it('should preserve repeated query params before validation', async () => {
		// Prepare
		const app = new Hono();
		const openApiRouter = createHonoOpenApiRouter<paths>(app);

		openApiRouter.get('/pet/findByTags', {
			querySchema: createStandardSchema<{ tags: string[] }>((value) => ({
				value: value as { tags: string[] }
			})),
			handler: (c) => {
				expect(c.req.valid('query').tags).toEqual(['tag1', 'tag2']);
				return c.json([]);
			}
		});

		// Act
		const response = await app.request('/pet/findByTags?tags=tag1&tags=tag2');

		// Assert
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([]);
	});
});

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
