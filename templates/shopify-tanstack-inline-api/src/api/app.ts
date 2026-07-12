import { OpenAPIHono } from '@hono/zod-openapi';
import { createValidationHook, errorHandler, notFoundHandler } from '@/api/modules/error';
import { registerApiRoutes } from '@/api/routes';
import type { TApiEnv } from '@/api/types';
import { openApiDocumentConfig } from '@/environment/configs/openapi.config';

export function createApi(): OpenAPIHono<TApiEnv> {
	const api = new OpenAPIHono<TApiEnv>({ defaultHook: createValidationHook<TApiEnv>() });

	api.onError(errorHandler);
	api.notFound(notFoundHandler);

	api.openAPIRegistry.registerComponent('securitySchemes', 'shopifySessionToken', {
		type: 'http',
		scheme: 'bearer'
	});
	registerApiRoutes(api);
	api.doc31('/openapi.json', openApiDocumentConfig);

	return api;
}
