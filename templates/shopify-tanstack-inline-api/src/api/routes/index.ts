import type { OpenAPIHono } from '@hono/zod-openapi';
import { handleAppUninstalledWebhook, shopifyAdminAuth } from '@/api/integrations/shopify';
import type { TApiEnv } from '@/api/types';
import { registerHealthRoute } from './v1.health';
import { registerShopRoute } from './v1.shop';

export function registerApiRoutes(api: OpenAPIHono<TApiEnv>): void {
	registerHealthRoute(api);
	api.use('/v1/shop', shopifyAdminAuth);
	registerShopRoute(api);
	api.post('/webhooks/shopify/app/uninstalled', handleAppUninstalledWebhook);
}
