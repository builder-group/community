import { createRoute, z } from '@hono/zod-openapi';
import { createErrorResponse } from '@/modules/error';

export const GreetResponseSchema = z
	.object({
		message: z.string().openapi({ example: 'Hello, Builder!' })
	})
	.openapi('GreetResponse');

export const GreetRoute = createRoute({
	method: 'get',
	path: '/v1/greet',
	tags: ['greet'],
	summary: 'Create a greeting',
	operationId: 'greet',
	request: {
		query: z.object({
			name: z.string().trim().min(1).default('Builder').openapi({ example: 'Builder' })
		})
	},
	responses: {
		200: {
			description: 'A greeting',
			content: {
				'application/json': {
					schema: GreetResponseSchema
				}
			}
		},
		400: createErrorResponse('The greeting request is invalid'),
		500: createErrorResponse('The API could not create the greeting')
	}
});
