import { Router } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { type paths } from './gen/v1';
import { PetSchema } from './schemas';

export const router: Router = Router();
export const openApiRouter = createExpressOpenApiRouter<paths>(router);

openApiRouter.get('/pet/{petId}', {
	pathValidator: vValidator(
		v.object({
			petId: v.number()
		})
	),
	handler: (req, res) => {
		const { petId } = req.params;

		res.send({
			name: 'Falko',
			photoUrls: []
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
