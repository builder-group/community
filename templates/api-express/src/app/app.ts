import cors from 'cors';
import express, { type Express } from 'express';
import { appConfig } from '@/environment';
import { errorMiddleware, notFoundMiddleware } from '@/modules/error';
import { openApiDocument } from '@/openapi/document.gen';
import { registerApiRoutes } from './routes';

export function createApi(): Express {
	const api = express();

	api.disable('x-powered-by');

	const corsOrigin = appConfig.cors.origin;
	if (corsOrigin != null) {
		api.use(cors({ origin: corsOrigin }));
	}

	api.use(express.json());

	registerApiRoutes(api);
	api.get('/openapi.json', (_request, response) => {
		response.json(openApiDocument);
	});

	api.use(notFoundMiddleware);
	api.use(errorMiddleware);

	return api;
}
