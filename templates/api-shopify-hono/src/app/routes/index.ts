import type { OpenAPIHono } from '@hono/zod-openapi';
import { registerHealthRoute } from './v1.health';
import { registerProductRoutes } from './v1.products';
import { registerShopRoute } from './v1.shop';
import { registerUserRoute } from './v1.user';
import { registerShopifyWebhookRoutes } from './v1.webhooks.shopify';

export function registerApiRoutes(api: OpenAPIHono): void {
	registerHealthRoute(api);
	registerProductRoutes(api);
	registerShopRoute(api);
	registerUserRoute(api);
	registerShopifyWebhookRoutes(api);
}
