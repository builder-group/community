import type { OpenAPIHono } from '@hono/zod-openapi';
import { getProductCount } from '@/modules/product';
import { GetProductCountRoute } from './schema';

export function registerProductRoutes(router: OpenAPIHono): void {
	router.openapi(GetProductCountRoute, async (context) => {
		const { shopifyUserCx } = context.var;
		const [isProductCountOk, productCountErr, productCount] = await getProductCount(shopifyUserCx);
		if (!isProductCountOk) {
			throw productCountErr;
		}

		return context.json(productCount, 200);
	});
}
