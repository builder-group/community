import type * as express from 'express';
import { createOpenApiRouter } from '../../create-openapi-router';
import { type TOpenApiRouter } from '../../types';
import { withExpress } from './with-express';

export function createExpressOpenApiRouter<GPaths extends object = object>(
	expressRouter: express.Router
): TOpenApiRouter<['base', 'express'], GPaths> {
	return withExpress(createOpenApiRouter(), expressRouter);
}
