import type { OpenAPIHono } from '@hono/zod-openapi';
import { registerHealthRoute } from './v1.health';
import { registerShopRoute } from './v1.shop';

export function registerApiRoutes(api: OpenAPIHono): void {
	registerHealthRoute(api);
	registerShopRoute(api);
}
