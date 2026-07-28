import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { logger } from '@/environment';
import { AppError, type TAppErrorCode, type TAppErrorDetail } from './AppError';
import type { TErrorResponse } from './openapi';

export const errorHandler: ErrorHandler = (error, context) => {
	// Note: Preserve intentional Hono responses such as redirects and authentication challenges
	// https://hono.dev/docs/api/exception#handling-httpexceptions
	if (error instanceof HTTPException) {
		return error.getResponse();
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
	} else {
		errorResponse = {
			code: '#ERR_INTERNAL_SERVER',
			status: 500,
			title: 'Internal Server Error',
			detail: 'An unexpected error occurred'
		};
	}

	let instance = context.req.path;
	if (errorResponse.status >= 500) {
		instance = `urn:uuid:${crypto.randomUUID()}`;
		// Note: Do not pass the Error directly to the logger because nested causes can expose query
		// parameters, third-party response data and credentials
		const stack = getErrorStackFrames(error);
		logger.error({
			code: errorResponse.code,
			name: error.name,
			message: errorResponse.detail,
			...(stack != null ? { stack } : {}),
			instance,
			method: context.req.method,
			path: context.req.path
		});
	}

	return context.json(
		{
			type: errorResponse.type ?? 'about:blank',
			title: errorResponse.title,
			status: errorResponse.status,
			detail: errorResponse.detail,
			instance,
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

function getErrorStackFrames(error: Error): string | undefined {
	const stack = error.stack
		?.split('\n')
		.filter((line) => line.trimStart().startsWith('at '))
		.join('\n');
	return stack != null && stack.length > 0 ? stack : undefined;
}
