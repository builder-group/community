import type * as hono from 'hono/types';
import { AppError } from '@ibg/openapi-router';

export const invalidPathHandler: hono.NotFoundHandler = (c) => {
	throw new AppError('#ERR_PATH_NOT_FOUND', 404, {
		description: `The specified path '${c.req.path}' does not exist!`
	});
};
