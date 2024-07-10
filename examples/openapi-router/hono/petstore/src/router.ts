import { Hono } from 'hono';
import { zValidator } from 'validation-adapters/zod';
import * as z from 'zod';
import { createHonoOpenApiRouter } from '@ibg/openapi-router';

import { paths } from './gen/v1';

export const router = new Hono();
export const openApiRouter = createHonoOpenApiRouter<paths>(router);

openApiRouter.get('/pet/{petId}', {
	pathValidator: zValidator(
		z.object({
			petId: z.number()
		})
	),
	handler: (c) => {
		const { petId } = c.req.valid('param');

		return c.json({
			name: 'Falko',
			photoUrls: []
		});
	}
});