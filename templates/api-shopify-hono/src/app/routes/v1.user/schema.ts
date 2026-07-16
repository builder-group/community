import { createRoute, z } from '@hono/zod-openapi';
import { createErrorResponse } from '@/modules/error';
import { shopifyUserAuth } from '../../middleware';

export const GetUserRoute = createRoute({
	method: 'get',
	path: '/v1/user',
	tags: ['user'],
	summary: 'Get the authenticated Shopify user',
	operationId: 'getUser',
	middleware: [shopifyUserAuth] as const,
	security: [{ shopifySessionToken: [] }],
	responses: {
		200: {
			description: 'The authenticated Shopify user',
			content: {
				'application/json': {
					schema: z
						.object({
							user: z.object({
								id: z.uuid().openapi({
									example: '123e4567-e89b-12d3-a456-426614174000'
								}),
								shopifyId: z.string().openapi({ example: '123456789' }),
								firstName: z.string().openapi({ example: 'Ada' }),
								lastName: z.string().openapi({ example: 'Lovelace' }),
								email: z.email().openapi({ example: 'ada@example.com' }),
								emailVerified: z.boolean().openapi({ example: true }),
								accountOwner: z.boolean().openapi({ example: true }),
								locale: z.string().openapi({ example: 'en' }),
								collaborator: z.boolean().openapi({ example: false })
							})
						})
						.openapi('UserResponse')
				}
			}
		},
		401: createErrorResponse('A valid Shopify session token is required'),
		403: createErrorResponse('The Shopify installation has not granted all required access scopes'),
		500: createErrorResponse('The API could not authenticate the Shopify user'),
		502: createErrorResponse('Shopify did not return a valid online access token'),
		503: createErrorResponse('Shopify or the token store is unavailable')
	}
});
