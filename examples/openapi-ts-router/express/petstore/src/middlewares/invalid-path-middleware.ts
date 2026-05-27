import type express from 'express';

export function invalidPathMiddleware(
	req: express.Request,
	_res: express.Response,
	next: express.NextFunction
): void {
	const error = new Error(`The specified path '${req.path}' does not exist!`);
	Object.assign(error, {
		status: 404,
		code: '#ERR_PATH_NOT_FOUND'
	});
	next(error);
}
