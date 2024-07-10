import { Router } from 'express';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { createExpressOpenApiRouter } from '@ibg/openapi-router';

import { type paths } from './gen/v1';

export const router: Router = Router();
export const openApiRouter = createExpressOpenApiRouter<paths>(router);

openApiRouter.get('/pet/{petId}', {
	pathValidator: vValidator(
		v.object({
			petId: v.number()
		})
	),
	handler: (req, res) => {
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
	queryValidator: vValidator(
		v.object({
			additionalMetadata: v.optional(v.string())
		})
	),
	handler: (req, res) => {
		const { petId } = req.params;
		req.query;

		res.send({});
	}
});
