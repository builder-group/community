import { createRoute, z } from '@hono/zod-openapi';
import { createErrorResponse } from '@/modules/error';
import { shopifyAdminAuth } from '../../middleware';

export const GetShopRoute = createRoute({
	method: 'get',
	path: '/v1/shop',
	tags: ['shop'],
	summary: 'Get the authenticated shop',
	operationId: 'getShop',
	middleware: [shopifyAdminAuth] as const,
	security: [{ shopifySessionToken: [] }],
	responses: {
		200: {
			description: 'The authenticated shop',
			content: {
				'application/json': {
					schema: z
						.object({
							shop: z.object({
								id: z.string().openapi({ example: 'gid://shopify/Shop/1' }),
								name: z.string().openapi({ example: 'Example shop' }),
								domain: z.string().openapi({ example: 'example.myshopify.com' })
							})
						})
						.openapi('ShopResponse')
				}
			}
		},
		401: createErrorResponse('A valid Shopify session token is required'),
		403: createErrorResponse('The Shopify installation has not granted all required access scopes'),
		429: createErrorResponse('Shopify Admin API rate limit exceeded'),
		500: createErrorResponse('The API could not load the shop'),
		502: createErrorResponse('Shopify did not return a valid response'),
		503: createErrorResponse('Shopify is unavailable')
	}
});
