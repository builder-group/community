import type express from 'express';
import { OpenApiValidationError } from 'openapi-ts-router';
import { type components } from '../gen/v1';

export function errorMiddleware(
	err: unknown,
	_req: express.Request,
	res: express.Response,
	_next: express.NextFunction
): void {
	let statusCode = 500;
	const jsonResponse: components['schemas']['AppError'] = {
		error_code: '#ERR_UNKNOWN',
		error_description: null,
		error_uri: null,
		additional_errors: []
	};

	if (err instanceof OpenApiValidationError) {
		statusCode = err.status;
		jsonResponse.error_code = err.code;
		jsonResponse.error_description = err.message;
	} else if (isHttpError(err)) {
		statusCode = err.status;
		jsonResponse.error_code = err.code ?? '#ERR_UNKNOWN';
		jsonResponse.error_description = err.message;
	} else if (typeof err === 'object' && err != null) {
		if ('message' in err && typeof err.message === 'string') {
			jsonResponse.error_description = err.message;
		}
		if ('code' in err && typeof err.code === 'string') {
			jsonResponse.error_code = err.code;
		}
	} else {
		jsonResponse.error_description = 'An unknown error occurred!';
	}

	res.status(statusCode).json(jsonResponse);
}

interface THttpError {
	status: number;
	code?: string;
	message: string;
}

function isHttpError(error: unknown): error is THttpError {
	return (
		typeof error === 'object' &&
		error != null &&
		'status' in error &&
		typeof error.status === 'number' &&
		'message' in error &&
		typeof error.message === 'string'
	);
}
