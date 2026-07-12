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
 * RFC 9457 Problem Details response schema with custom `code` and `errors` extension members.
 *
 * https://datatracker.ietf.org/doc/html/rfc9457
 */
export const ErrorResponseSchema = z
	.object({
		type: z.string().openapi({ example: 'about:blank' }),
		title: z.string().openapi({ example: 'Unauthorized' }),
		status: z.number().int().openapi({ example: 401 }),
		detail: z.string().openapi({ example: 'A valid Shopify session token is required' }),
		instance: z.string().openapi({ example: '/v1/shop' }),
		code: z.string().openapi({ example: '#ERR_SHOPIFY_UNAUTHORIZED' }),
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

export function createValidationHook<GEnv extends Env>(): NonNullable<
	OpenAPIHonoOptions<GEnv>['defaultHook']
> {
	return (result) => {
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
}

const validationSourceByTarget = {
	json: 'body',
	form: 'body',
	query: 'query',
	param: 'path',
	header: 'header',
	cookie: 'cookie'
} as const satisfies Record<keyof ValidationTargets, TAppErrorSource>;
