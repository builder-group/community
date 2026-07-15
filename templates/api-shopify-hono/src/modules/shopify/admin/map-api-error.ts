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

	// Note: Shopify can report permission denial as either HTTP 403 or a GraphQL error response
	// https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/online-access-tokens#authorization
	// https://shopify.dev/docs/api/admin-graphql/latest#status-and-error-codes
	const isHttpAccessDenied = error instanceof HttpError && error.status === 403;
	const isGraphqlAccessDenied =
		error instanceof GraphQLError &&
		error.errors.some((graphQLError) => graphQLError.extensions?.['code'] === 'ACCESS_DENIED');
	if (isHttpAccessDenied || isGraphqlAccessDenied) {
		return new AppError(code, {
			status: 403,
			title: 'Forbidden',
			detail: 'Shopify denied access to the requested Admin API resource',
			cause: error
		});
	}

	// Note: Shopify can report throttling as either HTTP 429 or a GraphQL error response
	// https://shopify.dev/docs/api/usage/limits
	// https://shopify.dev/docs/api/admin-graphql/latest#status-and-error-codes
	const isHttpThrottled = error instanceof HttpError && error.status === 429;
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

	// Note: Shopify can report an inactive shop as HTTP 402 or 423, or as a GraphQL error response
	// https://shopify.dev/docs/api/admin-graphql/latest#status-and-error-codes
	const isHttpShopInactive =
		error instanceof HttpError && (error.status === 402 || error.status === 423);
	const isGraphqlShopInactive =
		error instanceof GraphQLError &&
		error.errors.some((graphQLError) => graphQLError.extensions?.['code'] === 'SHOP_INACTIVE');
	if (isHttpShopInactive || isGraphqlShopInactive) {
		return new AppError(code, {
			status: 423,
			title: 'Locked',
			detail: 'The Shopify shop is inactive or unavailable',
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
