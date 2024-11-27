import { AppError } from '@blgc/openapi-router';
import type * as hono from 'hono/types';

export const invalidPathHandler: hono.NotFoundHandler = (c) => {
	throw new AppError('#ERR_PATH_NOT_FOUND', 404, {
		description: `The specified path '${c.req.path}' does not exist!`
	});
};
