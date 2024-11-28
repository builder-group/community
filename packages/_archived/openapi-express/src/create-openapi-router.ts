import type express from 'express';
import { OpenApiRouter } from './OpenApiRouter';

export function createOpenApiRouter<GPaths extends object = object>(
	router: express.Router
): OpenApiRouter<GPaths> {
	return new OpenApiRouter<GPaths>(router);
}
