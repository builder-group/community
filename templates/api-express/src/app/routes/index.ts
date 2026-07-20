import type { Express } from 'express';
import { createExpressOpenApiRouter } from 'openapi-ts-router/express';
import type { apiV1 } from '@/openapi';
import { registerGreetRoute } from './v1.greet';
import { registerHealthRoute } from './v1.health';

export function registerApiRoutes(api: Express): void {
	const openApiRouter = createExpressOpenApiRouter<apiV1.paths>(api);

	registerGreetRoute(openApiRouter);
	registerHealthRoute(openApiRouter);
}

export type TApiRouter = ReturnType<typeof createExpressOpenApiRouter<apiV1.paths>>;
