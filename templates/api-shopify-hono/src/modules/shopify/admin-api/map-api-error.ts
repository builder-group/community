import { GraphQLError, HttpError, NetworkError, type FetchError } from 'feature-fetch';
import { AppError, type TAppErrorCode } from '@/modules/error';

export function mapShopifyAdminApiError(
	error: FetchError,
	options: TMapShopifyAdminApiErrorOptions
): AppError {
	const { code, detail } = options;

	if (isShopifyThrottledError(error)) {
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

// Shopify Admin API rate limits: https://shopify.dev/docs/api/usage/limits
function isShopifyThrottledError(error: FetchError): boolean {
	if (error instanceof HttpError && error.status === 429) {
		return true;
	}

	// Note: Shopify reports GraphQL throttling inside HTTP 200 responses: https://shopify.dev/docs/api/admin-graphql/latest#status-and-error-codes
	return (
		error instanceof GraphQLError &&
		error.errors.some((graphQLError) => graphQLError.extensions?.['code'] === 'THROTTLED')
	);
}
