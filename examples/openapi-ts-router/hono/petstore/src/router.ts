import { Hono } from 'hono';
import { createHonoOpenApiRouter } from 'openapi-ts-router';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';
import { paths } from './gen/v1';
import { PetSchema } from './schemas';

export const router = new Hono();
export const openApiRouter = createHonoOpenApiRouter<paths>(router);

openApiRouter.get('/pet/{petId}', {
	pathValidator: zValidator(
		z.object({
			petId: z.number()
		})
	),
	middlewares: [
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
	pathValidator: vValidator(
		v.object({
			petId: v.number()
		})
	),
	queryValidator: zValidator(
		z.object({
			additionalMetadata: z.string().optional()
		})
	),
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
	bodyValidator: zValidator(PetSchema),
	handler: (c) => {
		const { name, photoUrls } = c.req.valid('json');

		return c.json({ name, photoUrls });
	}
});
