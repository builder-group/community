import type { OpenAPIHono } from '@hono/zod-openapi';
import { getShop } from '@/modules/shop';
import { GetShopRoute } from './schema';

export function registerShopRoute(router: OpenAPIHono): void {
	router.openapi(GetShopRoute, async (context) => {
		const { shopifyInstallationCx } = context.var;
		const [isShopOk, shopErr, shop] = await getShop(shopifyInstallationCx);
		if (!isShopOk) {
			throw shopErr;
		}

		return context.json({ shop }, 200);
	});
}
