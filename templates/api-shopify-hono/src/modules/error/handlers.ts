import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { logger } from '@/environment';
import { AppError, type TAppErrorCode, type TAppErrorDetail } from './AppError';
import type { TErrorResponse } from './openapi';

export const errorHandler: ErrorHandler = (error, context) => {
	// Preserve intentional Hono responses such as redirects and authentication challenges
	if (error instanceof HTTPException && error.status < 500) {
		return error.getResponse();
	}

	let errorResponse: TErrorResponseDetails;
	if (error instanceof AppError) {
		if (error.status >= 500) {
			logger.error(error, { method: context.req.method, path: context.req.path });
		}

		errorResponse = {
			code: error.code,
			status: error.status,
			type: error.type,
			title: error.title,
			detail: error.detail,
			errors: error.errors
		};
	} else {
		logger.error(error, { method: context.req.method, path: context.req.path });

		errorResponse = {
			code: '#ERR_INTERNAL_SERVER',
			status: 500,
			title: 'Internal Server Error',
			detail: 'An unexpected error occurred'
		};
	}

	return context.json(
		{
			type: errorResponse.type ?? 'about:blank',
			title: errorResponse.title,
			status: errorResponse.status,
			detail: errorResponse.detail,
			instance: context.req.path,
			code: errorResponse.code,
			...(errorResponse.errors != null ? { errors: errorResponse.errors } : {})
		} satisfies TErrorResponse,
		errorResponse.status,
		{
			'Content-Type': 'application/problem+json'
		}
	);
};

interface TErrorResponseDetails {
	code: TAppErrorCode;
	status: ContentfulStatusCode;
	title: string;
	detail: string;
	type?: string;
	errors?: TAppErrorDetail[];
}

export const notFoundHandler: NotFoundHandler = (context) => {
	throw new AppError('#ERR_PATH_NOT_FOUND', {
		status: 404,
		title: 'Not Found',
		detail: `The path '${context.req.path}' does not exist`
	});
};
