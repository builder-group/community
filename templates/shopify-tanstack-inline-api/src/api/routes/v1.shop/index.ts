import type { OpenAPIHono } from '@hono/zod-openapi';
import { AppError } from '@/api/modules/error';
import type { TApiEnv } from '@/api/types';
import { GetShopRoute } from './schema';

const ShopQuery = `#graphql
	query Shop {
		shop {
			id
			name
			myshopifyDomain
		}
	}
`;

interface TShopQueryData {
	shop: {
		id: string;
		name: string;
		myshopifyDomain: string;
	};
}

export function registerShopRoute(router: OpenAPIHono<TApiEnv>): void {
	router.openapi(GetShopRoute, async (context) => {
		const response = await context.get('shopify').admin.request<TShopQueryData>(ShopQuery);
		if (response.data == null) {
			throw new AppError('#ERR_SHOPIFY_ADMIN_API', {
				status: 502,
				title: 'Bad Gateway',
				detail: 'Shopify did not return the shop'
			});
		}

		return context.json(
			{
				shop: {
					id: response.data.shop.id,
					name: response.data.shop.name,
					domain: response.data.shop.myshopifyDomain
				}
			},
			200
		);
	});
}
