import { createRoute, z } from '@hono/zod-openapi';
import { createErrorResponse } from '@/modules/error';

export const CheckHealthRoute = createRoute({
	method: 'get',
	path: '/v1/health',
	tags: ['health'],
	summary: 'Check API health',
	operationId: 'checkHealth',
	responses: {
		200: {
			description: 'The API is healthy',
			content: {
				'application/json': {
					schema: z
						.object({
							status: z.literal('ok').openapi({ example: 'ok' }),
							version: z.string().openapi({ example: '0.0.1d' })
						})
						.openapi('HealthResponse')
				}
			}
		},
		500: createErrorResponse('The API could not complete the health check')
	}
});
