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
