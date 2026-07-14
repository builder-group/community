import { redirect } from '@tanstack/react-router';
import { createIsomorphicFn, createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { shopifyConfig } from '@/environment/configs/shopify.config.server';
import { createShopifySessionTokenBounceHref, extractShopifySessionToken } from './session-token';

export const getPublicShopifyConfig = createServerFn({ method: 'GET' }).handler(() => ({
	apiKey: shopifyConfig.apiKey
}));

// Note: Shopify supplies document tokens through `id_token` while App Bridge supplies fresh browser tokens
export const getShopifySessionToken = createIsomorphicFn()
	.server(() => extractShopifySessionToken(getRequest()))
	// https://shopify.dev/docs/api/app-home/apis/authentication-and-data/id-token-api
	.client(async () => {
		const sessionToken = await shopify.idToken();
		return sessionToken.length === 0 ? null : sessionToken;
	});

export const createShopifySessionTokenBounceRedirect = createIsomorphicFn()
	.server(() => {
		return redirect({
			href: createShopifySessionTokenBounceHref(getRequest()),
			statusCode: 302
		});
	})
	.client(() => {
		return redirect({
			href: createShopifySessionTokenBounceHref(new Request(window.location.href)),
			statusCode: 302
		});
	});
