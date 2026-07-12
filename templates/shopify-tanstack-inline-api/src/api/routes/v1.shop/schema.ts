import { createRoute, z } from '@hono/zod-openapi';
import { createErrorResponse } from '@/api/modules/error';

export const ShopResponseSchema = z
	.object({
		shop: z.object({
			id: z.string().openapi({ example: 'gid://shopify/Shop/1' }),
			name: z.string().openapi({ example: 'Example shop' }),
			domain: z.string().openapi({ example: 'example.myshopify.com' })
		})
	})
	.openapi('ShopResponse');

export const GetShopRoute = createRoute({
	method: 'get',
	path: '/v1/shop',
	tags: ['shop'],
	summary: 'Get the authenticated shop',
	operationId: 'getShop',
	security: [{ shopifySessionToken: [] }],
	responses: {
		200: {
			description: 'The authenticated shop',
			content: {
				'application/json': {
					schema: ShopResponseSchema
				}
			}
		},
		401: createErrorResponse('A valid Shopify session token is required'),
		502: createErrorResponse('Shopify did not return a valid response'),
		500: createErrorResponse('The API could not load the shop')
	}
});
