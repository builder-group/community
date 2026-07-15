import { z, type OpenAPIHonoOptions } from '@hono/zod-openapi';
import type { Env, ValidationTargets } from 'hono';
import { AppError, type TAppErrorSource } from './AppError';

export const ErrorDetailSchema = z
	.object({
		source: z.enum(['body', 'path', 'query', 'header', 'cookie']).openapi({ example: 'query' }),
		path: z.array(z.union([z.string(), z.number()])).openapi({ example: ['name'] }),
		detail: z.string().openapi({ example: 'String must contain at least 1 character' })
	})
	.openapi('ErrorDetail');

/**
 * Defines an RFC 9457 Problem Details response schema with custom extension members.
 *
 * https://datatracker.ietf.org/doc/html/rfc9457
 */
export const ErrorResponseSchema = z
	.object({
		type: z.string().openapi({ example: 'about:blank' }),
		title: z.string().openapi({ example: 'Bad Request' }),
		status: z.number().int().openapi({ example: 400 }),
		detail: z.string().openapi({ example: 'The request could not be validated' }),
		instance: z.string().openapi({ example: '/v1/shop' }),
		code: z.string().openapi({ example: '#ERR_VALIDATION_FAILED' }),
		errors: z.array(ErrorDetailSchema).optional()
	})
	.openapi('ErrorResponse');

export type TErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function createErrorResponse(description: string) {
	return {
		description,
		content: {
			'application/problem+json': {
				schema: ErrorResponseSchema
			}
		}
	} as const;
}

export const validationHook: NonNullable<OpenAPIHonoOptions<Env>['defaultHook']> = (result) => {
	if (!result.success) {
		throw new AppError('#ERR_VALIDATION_FAILED', {
			status: 400,
			title: 'Bad Request',
			detail: 'The request could not be validated',
			errors: result.error.issues.map((issue) => ({
				source: validationSourceByTarget[result.target],
				path: issue.path.map((segment) =>
					typeof segment === 'symbol' ? segment.toString() : segment
				),
				detail: issue.message
			}))
		});
	}
};

const validationSourceByTarget = {
	json: 'body',
	form: 'body',
	query: 'query',
	param: 'path',
	header: 'header',
	cookie: 'cookie'
} as const satisfies Record<keyof ValidationTargets, TAppErrorSource>;
