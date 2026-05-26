import { Router } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router/express';
import * as v from 'valibot';
import { type paths } from './gen/v1';
import { PetSchema } from './schemas';

export const router: Router = Router();
export const openApiRouter = createExpressOpenApiRouter<paths>(router);

openApiRouter.get('/pet/{petId}', {
	pathSchema: v.object({
		petId: v.number()
	}),
	middleware: [
		(req, res, next) => {
			console.log('middleware');
			next();
		}
	],
	handler: (req, res) => {
		const { petId } = req.valid.path;
		console.log('handler', petId, typeof petId);

		res.json({
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
	handler: (req, res) => {
		const { petId } = req.valid.path;
		const { additionalMetadata } = req.valid.query;
		console.log('uploadFile', { petId, additionalMetadata });

		res.json({
			code: 200,
			type: 'success',
			message: 'File uploaded successfully'
		});
	}
});

openApiRouter.post('/pet', {
	bodySchema: PetSchema,
	handler: (req, res) => {
		const { name, photoUrls } = req.valid.body;

		res.json({ name, photoUrls });
	}
});
