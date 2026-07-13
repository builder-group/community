import type { OpenAPIHono } from '@hono/zod-openapi';
import { registerHealthRoute } from './v1.health';
import { registerShopRoute } from './v1.shop';
import { registerShopifyWebhookRoutes } from './v1.webhooks.shopify';

export function registerApiRoutes(api: OpenAPIHono): void {
	registerHealthRoute(api);
	registerShopRoute(api);
	registerShopifyWebhookRoutes(api);
}
