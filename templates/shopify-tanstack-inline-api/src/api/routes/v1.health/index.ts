import type { OpenAPIHono } from '@hono/zod-openapi';
import type { TApiEnv } from '@/api/types';
import { CheckHealthRoute } from './schema';

export function registerHealthRoute(router: OpenAPIHono<TApiEnv>): void {
	router.openapi(CheckHealthRoute, (context) => {
		return context.json({ status: 'ok' } as const, 200);
	});
}
