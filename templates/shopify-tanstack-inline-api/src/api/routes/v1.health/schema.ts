import { createRoute, z } from '@hono/zod-openapi';
import { createErrorResponse } from '@/api/modules/error';

export const HealthResponseSchema = z
	.object({
		status: z.literal('ok').openapi({ example: 'ok' })
	})
	.openapi('HealthResponse');

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
					schema: HealthResponseSchema
				}
			}
		},
		500: createErrorResponse('The API could not complete the health check')
	}
});
