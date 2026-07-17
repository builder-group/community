// https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript#retrieving-session-token
export function extractShopifySessionToken(request: Request): string | null {
	const authorization = request.headers.get('Authorization');
	const headerToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
	if (headerToken != null && headerToken.length !== 0) {
		return headerToken;
	}

	const urlToken = new URL(request.url).searchParams.get('id_token');
	if (urlToken != null && urlToken.length !== 0) {
		return urlToken;
	}

	return null;
}

// https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript#bounce-page-to-get-a-session-token-from-app-bridge
export function createShopifySessionTokenBounceHref(request: Request): string {
	const url = new URL(request.url);
	const searchParams = url.searchParams;
	searchParams.delete('id_token');
	searchParams.delete('shopify-reload');

	const reloadSearch = searchParams.toString();
	const reloadHref = reloadSearch.length > 0 ? `${url.pathname}?${reloadSearch}` : url.pathname;
	searchParams.set('shopify-reload', reloadHref);

	return `/auth/session-token?${searchParams.toString()}`;
}
