import type * as hono from 'hono/types';

export const invalidPathHandler: hono.NotFoundHandler = (c) => {
	const error = new Error(`The specified path '${c.req.path}' does not exist!`);
	Object.assign(error, {
		status: 404,
		code: '#ERR_PATH_NOT_FOUND'
	});
	throw error;
};
