import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import type { apiV1 } from '@template/api-shopify-hono/openapi';
import {
	createOpenApiFetchClient,
	HttpError,
	setHeader,
	type FetchError,
	type TPrepareRequestContext
} from 'feature-fetch';
import { createShopifySessionTokenBounceRedirect, getShopifySessionToken } from '@/modules/shopify';

export const apiClient = createOpenApiFetchClient<apiV1.paths>({
	baseUrl: '/api',
	fetch: (url, init) => apiFetch(url, init),
	prepareRequest: [addShopifySessionTokenHeader]
});

async function addShopifySessionTokenHeader(cx: TPrepareRequestContext): Promise<void> {
	const sessionToken = await getShopifySessionToken();
	if (sessionToken == null) {
		throw new Error('Shopify ID token is required');
	}

	setHeader(cx.headers, 'Authorization', `Bearer ${sessionToken}`);
}

// Note: Server fetch requires an absolute URL while browser fetch can resolve `/api` against the current origin
const apiFetch = createIsomorphicFn()
	.server((url: URL | string, init?: RequestInit) => {
		return fetch(new URL(url, getRequest().url), init);
	})
	.client((url: URL | string, init?: RequestInit) => fetch(url, init));

export function mapApiError(
	error: FetchError
): FetchError | ReturnType<typeof createShopifySessionTokenBounceRedirect> {
	const isShopifySessionTokenInvalid =
		error instanceof HttpError &&
		error.status === 401 &&
		typeof error.data === 'object' &&
		error.data != null &&
		'code' in error.data &&
		error.data.code === '#ERR_SHOPIFY_SESSION_TOKEN_INVALID';
	if (isShopifySessionTokenInvalid) {
		return createShopifySessionTokenBounceRedirect();
	}

	return error;
}
