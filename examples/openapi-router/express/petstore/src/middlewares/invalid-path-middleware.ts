import type express from 'express';
import { AppError } from '@blgc/openapi-router';

export function invalidPathMiddleware(
	req: express.Request,
	_res: express.Response,
	next: express.NextFunction
): void {
	next(
		new AppError('#ERR_PATH_NOT_FOUND', 404, {
			description: `The specified path '${req.path}' does not exist!`
		})
	);
}
