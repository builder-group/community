import { createMiddleware } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';

export const shopifyIframeProtectionMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const shop = sanitizeShopDomain(new URL(request.url).searchParams.get('shop'));

		// Note: Shopify requires a shop-specific frame ancestor on every embedded app response
		// https://shopify.dev/docs/apps/build/security/set-up-iframe-protection
		const frameAncestors = shop == null ? "'none'" : `https://${shop} https://admin.shopify.com`;
		setResponseHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors};`);

		return next();
	}
);

function sanitizeShopDomain(shop: string | null): string | null {
	if (shop == null) {
		return null;
	}

	const normalizedShop = shop.trim().toLowerCase();
	return shopDomainRegex.test(normalizedShop) ? normalizedShop : null;
}

const shopDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]*\.myshopify\.com$/;
