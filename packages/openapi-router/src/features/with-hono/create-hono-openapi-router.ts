import { type Hono } from 'hono';
import { createOpenApiRouter } from '../../create-openapi-router';
import { type TOpenApiRouter } from '../../types';
import { withHono } from './with-hono';

export function createHonoOpenApiRouter<GPaths extends object = object>(
	hono: Hono
): TOpenApiRouter<['base', 'hono'], GPaths> {
	return withHono(createOpenApiRouter(), hono);
}
