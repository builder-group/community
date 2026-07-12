import type { OpenAPIHono } from '@hono/zod-openapi';
import { registerGreetRoute } from './v1.greet';
import { registerHealthRoute } from './v1.health';

export function registerApiRoutes(api: OpenAPIHono): void {
	registerGreetRoute(api);
	registerHealthRoute(api);
}
