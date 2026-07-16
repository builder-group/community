import type { OpenAPIHono } from '@hono/zod-openapi';
import { GetUserRoute } from './schema';

export function registerUserRoute(router: OpenAPIHono): void {
	router.openapi(GetUserRoute, async (context) => {
		const { shopifyUserCx } = context.var;
		return context.json({ user: shopifyUserCx.shopifyUser }, 200);
	});
}
