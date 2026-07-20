import { STATUS_CODES } from 'node:http';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { OpenApiValidationError } from 'openapi-ts-router/express';
import type { apiV1 } from '@/openapi';
import { AppError, type TAppErrorCode, type TAppErrorDetail } from './AppError';

export const errorMiddleware: ErrorRequestHandler = (error, request, response, next) => {
	// Note: Delegate partially written responses so Express can close the connection safely
	// https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
	if (response.headersSent) {
		next(error);
		return;
	}

	let errorResponse: TErrorResponseDetails;
	if (error instanceof AppError) {
		errorResponse = {
			code: error.code,
			status: error.status,
			type: error.type,
			title: error.title,
			detail: error.detail,
			errors: error.errors
		};
	} else if (error instanceof OpenApiValidationError) {
		errorResponse = {
			code: '#ERR_VALIDATION_FAILED',
			status: error.status,
			title: 'Bad Request',
			detail: 'The request could not be validated',
			errors: error.issues.map((issue) => ({
				source: issue.source,
				path: (issue.path ?? []).map((segment) =>
					typeof segment === 'symbol' ? segment.toString() : segment
				),
				detail: issue.message
			}))
		};
	} else if (isClientHttpError(error)) {
		const title = STATUS_CODES[error.status] ?? 'Request Error';

		errorResponse = {
			code: '#ERR_HTTP_REQUEST',
			status: error.status,
			title,
			// Note: Middleware messages are public only when explicitly marked as safe
			// https://expressjs.com/en/resources/middleware/body-parser.html#errors
			detail: error.expose === true ? error.message : title
		};
	} else {
		errorResponse = {
			code: '#ERR_INTERNAL_SERVER',
			status: 500,
			title: 'Internal Server Error',
			detail: 'An unexpected error occurred'
		};
	}

	response
		.status(errorResponse.status)
		.type('application/problem+json')
		.json({
			type: errorResponse.type ?? 'about:blank',
			title: errorResponse.title,
			status: errorResponse.status,
			detail: errorResponse.detail,
			instance: request.path,
			code: errorResponse.code,
			...(errorResponse.errors != null ? { errors: errorResponse.errors } : {})
		} satisfies apiV1.components['schemas']['ErrorResponse']);
};

interface TErrorResponseDetails {
	code: TAppErrorCode;
	status: number;
	title: string;
	detail: string;
	type?: string;
	errors?: TAppErrorDetail[];
}

function isClientHttpError(error: unknown): error is TClientHttpError {
	return (
		typeof error === 'object' &&
		error != null &&
		'status' in error &&
		typeof error.status === 'number' &&
		error.status >= 400 &&
		error.status < 500 &&
		'message' in error &&
		typeof error.message === 'string'
	);
}

interface TClientHttpError {
	status: number;
	message: string;
	expose?: unknown;
}

export const notFoundMiddleware: RequestHandler = (request, _response, next) => {
	next(
		new AppError('#ERR_PATH_NOT_FOUND', {
			status: 404,
			title: 'Not Found',
			detail: `The path '${request.path}' does not exist`
		})
	);
};
