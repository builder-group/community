import { Router } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';
import { type paths } from './gen/v1';
import { PetSchema } from './schemas';

export const router: Router = Router();
export const openApiRouter = createExpressOpenApiRouter<paths>(router);

openApiRouter.get('/pet/{petId}', {
	pathValidator: zValidator(
		z.object({
			petId: z.number()
		})
	),
	middlewares: [
		(req, res, next) => {
			console.log('middleware');
			next();
		}
	],
	handler: (req, res) => {
		const { petId } = req.valid.params;
		console.log('handler', petId, typeof petId);

		res.send({
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
	handler: (req, res) => {
		const { petId } = req.valid.params;
		const { additionalMetadata } = req.valid.query;
		console.log('uploadFile', { petId, additionalMetadata });

		res.send({
			code: 200,
			type: 'success',
			message: 'File uploaded successfully'
		});
	}
});

openApiRouter.post('/pet', {
	bodyValidator: vValidator(PetSchema),
	handler: (req, res) => {
		const { name, photoUrls } = req.body;

		res.send({ name, photoUrls });
	}
});
