import { createOpenApiFetchClient, type TFetchMiddleware } from 'feature-fetch';
import type { paths } from '@/api/openapi/api-v1.gen';

export const apiClient = createOpenApiFetchClient<paths>({
	baseUrl: '/api',
	middleware: [createShopifyTokenMiddleware()]
});

function createShopifyTokenMiddleware(): TFetchMiddleware {
	return (next) => async (url, init) => {
		const idToken = await shopify.idToken();
		const headers = new Headers(init?.headers);
		headers.set('Authorization', `Bearer ${idToken}`);

		return next(url, { ...init, headers });
	};
}
