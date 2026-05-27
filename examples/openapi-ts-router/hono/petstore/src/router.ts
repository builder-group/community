import { Hono } from 'hono';
import { createHonoOpenApiRouter } from 'openapi-ts-router/hono';
import * as v from 'valibot';
import { paths } from './gen/v1';
import { PetSchema } from './schemas';

export const router = new Hono();
export const openApiRouter = createHonoOpenApiRouter<paths>(router);

openApiRouter.get('/pet/{petId}', {
	pathSchema: v.object({
		petId: v.number()
	}),
	middleware: [
		async (c, next) => {
			console.log('middleware');
			await next();
		}
	],
	handler: (c) => {
		const { petId } = c.req.valid('param');
		console.log('handler', petId, typeof petId);

		return c.json({
			name: 'Falko',
			photoUrls: []
		});
	}
});

openApiRouter.post('/pet/{petId}/uploadImage', {
	pathSchema: v.object({
		petId: v.number()
	}),
	querySchema: v.object({
		additionalMetadata: v.optional(v.string())
	}),
	handler: (c) => {
		const { petId } = c.req.valid('param');
		const { additionalMetadata } = c.req.valid('query');
		console.log('uploadFile', { petId, additionalMetadata });

		return c.json({
			code: 200,
			type: 'success',
			message: 'File uploaded successfully'
		});
	}
});

openApiRouter.post('/pet', {
	bodySchema: PetSchema,
	handler: (c) => {
		const { name, photoUrls } = c.req.valid('json');

		return c.json({ name, photoUrls });
	}
});
