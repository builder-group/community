import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { createShopifySessionTokenBounceHref, extractShopifySessionToken } from './session-token';

export const shopifySessionTokenMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const sessionToken = extractShopifySessionToken(request);
		if (sessionToken == null) {
			throw redirect({
				href: createShopifySessionTokenBounceHref(request),
				statusCode: 302
			});
		}

		return next();
	}
);

export const shopifyIframeProtectionMiddleware =
	createShopifyIframeProtectionMiddleware('deny-unknown-shop');

// Note: The bounce document must load inside Shopify Admin even without a valid `shop` parameter
export const shopifyBounceIframeProtectionMiddleware =
	createShopifyIframeProtectionMiddleware('allow-unknown-shop');

// https://shopify.dev/docs/apps/build/security/set-up-iframe-protection
function createShopifyIframeProtectionMiddleware(
	unknownShopPolicy: 'allow-unknown-shop' | 'deny-unknown-shop'
) {
	return createMiddleware().server(async ({ next, request }) => {
		const shop = sanitizeShopDomain(new URL(request.url).searchParams.get('shop'));
		if (shop == null) {
			if (unknownShopPolicy === 'deny-unknown-shop') {
				// Note: Block framing when no validated shop is available to scope the policy
				setResponseHeader('Content-Security-Policy', "frame-ancestors 'none';");
			}

			return next();
		}

		setResponseHeader(
			'Content-Security-Policy',
			`frame-ancestors https://${shop} https://admin.shopify.com;`
		);

		return next();
	});
}

function sanitizeShopDomain(shop: string | null): string | null {
	if (shop == null) {
		return null;
	}

	const normalizedShop = shop.trim().toLowerCase();
	return shopDomainRegex.test(normalizedShop) ? normalizedShop : null;
}

const shopDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]*\.myshopify\.com$/;
