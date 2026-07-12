import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { appConfig, openApiDocumentConfig } from '@/environment';
import { errorHandler, notFoundHandler, validationHook } from '@/modules/error';
import { registerApiRoutes } from './routes';

export function createApi(): OpenAPIHono {
	const api = new OpenAPIHono({ defaultHook: validationHook });

	api.onError(errorHandler);
	api.notFound(notFoundHandler);

	const corsOrigin = appConfig.cors.origin;
	if (corsOrigin != null) {
		api.use('*', cors(appConfig.cors));
	}

	api.openAPIRegistry.registerComponent('securitySchemes', 'shopifySessionToken', {
		type: 'http',
		scheme: 'bearer',
		bearerFormat: 'JWT',
		description: 'Shopify App Bridge session token'
	});
	registerApiRoutes(api);
	api.doc31('/openapi.json', openApiDocumentConfig);

	return api;
}
