import { createRoute, z } from '@hono/zod-openapi';
import { createErrorResponse } from '@/modules/error';
import { shopifyUserAuth } from '../../middleware';

export const GetProductCountRoute = createRoute({
	method: 'get',
	path: '/v1/products/count',
	tags: ['products'],
	summary: 'Get the product count available to the authenticated Shopify user',
	operationId: 'getProductCount',
	middleware: [shopifyUserAuth] as const,
	security: [{ shopifySessionToken: [] }],
	responses: {
		200: {
			description: 'The product count available to the authenticated Shopify user',
			content: {
				'application/json': {
					schema: z
						.object({
							count: z.number().int().nonnegative().openapi({ example: 42 }),
							precision: z.enum(['EXACT', 'AT_LEAST']).openapi({ example: 'EXACT' })
						})
						.openapi('ProductCountResponse')
				}
			}
		},
		401: createErrorResponse('A valid Shopify session token is required'),
		403: createErrorResponse('The app or authenticated Shopify user cannot access products'),
		423: createErrorResponse('The Shopify shop is inactive or unavailable'),
		429: createErrorResponse('Shopify Admin API rate limit exceeded'),
		500: createErrorResponse('The API could not load the product count'),
		502: createErrorResponse('Shopify did not return a valid product count'),
		503: createErrorResponse('Shopify or the token store is unavailable')
	}
});
