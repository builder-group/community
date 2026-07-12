import type { OpenAPIHono } from '@hono/zod-openapi';
import { appConfig } from '@/environment';
import { CheckHealthRoute } from './schema';

export function registerHealthRoute(router: OpenAPIHono): void {
	router.openapi(CheckHealthRoute, (context) => {
		return context.json({ status: 'ok', version: appConfig.version } as const, 200);
	});
}
