import { GraphQLError, HttpError, NetworkError, type FetchError } from 'feature-fetch';
import { AppError, type TAppErrorCode } from '@/modules/error';

export function mapShopifyAdminApiError(
	error: FetchError,
	options: TMapShopifyAdminApiErrorOptions
): AppError {
	const { code, detail } = options;

	if (error instanceof HttpError && error.status === 401) {
		return new AppError('#ERR_SHOPIFY_ADMIN_ACCESS_TOKEN_INVALID', {
			status: 401,
			title: 'Unauthorized',
			detail: 'Shopify rejected the stored Admin API access token',
			cause: error
		});
	}

	// https://shopify.dev/docs/api/usage/limits
	const isHttpThrottled = error instanceof HttpError && error.status === 429;
	// Note: Shopify reports GraphQL throttling inside HTTP 200 responses: https://shopify.dev/docs/api/admin-graphql/latest#status-and-error-codes
	const isGraphqlThrottled =
		error instanceof GraphQLError &&
		error.errors.some((graphQLError) => graphQLError.extensions?.['code'] === 'THROTTLED');
	if (isHttpThrottled || isGraphqlThrottled) {
		return new AppError(code, {
			status: 429,
			title: 'Too Many Requests',
			detail,
			cause: error
		});
	}

	if (error instanceof NetworkError) {
		return new AppError(code, {
			status: 503,
			title: 'Service Unavailable',
			detail,
			cause: error
		});
	}

	return new AppError(code, {
		status: 502,
		title: 'Bad Gateway',
		detail,
		cause: error
	});
}

interface TMapShopifyAdminApiErrorOptions {
	code: TAppErrorCode;
	detail: string;
}
