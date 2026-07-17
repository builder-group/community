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
		const shop = resolveShopifyFrameAncestorShop(request);
		if (shop == null) {
			if (unknownShopPolicy === 'deny-unknown-shop') {
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

function resolveShopifyFrameAncestorShop(request: Request): string | null {
	const queryShop = sanitizeShopDomain(new URL(request.url).searchParams.get('shop'));
	if (queryShop != null) {
		return queryShop;
	}

	const sessionToken = extractShopifySessionToken(request);
	if (sessionToken == null) {
		return null;
	}

	// Note: This unverified claim only scopes iframe CSP. Hono verifies the token before
	// authorizing API access.
	return extractShopDomainFromSessionToken(sessionToken);
}

function extractShopDomainFromSessionToken(sessionToken: string): string | null {
	// Note: JWTs use `header.payload.signature`
	const base64UrlPayload = sessionToken.split('.')[1];
	if (base64UrlPayload == null || !base64UrlPayload.length) {
		return null;
	}

	try {
		const base64Payload = base64UrlPayload.replaceAll('-', '+').replaceAll('_', '/');
		const payloadJson = atob(base64Payload);
		const tokenPayload: unknown = JSON.parse(payloadJson);
		if (
			typeof tokenPayload !== 'object' ||
			tokenPayload == null ||
			!('dest' in tokenPayload) ||
			typeof tokenPayload.dest !== 'string'
		) {
			return null;
		}

		return sanitizeShopDomain(new URL(tokenPayload.dest).hostname);
	} catch {
		return null;
	}
}

function sanitizeShopDomain(shop: string | null): string | null {
	if (shop == null) {
		return null;
	}

	const normalizedShop = shop.trim().toLowerCase();
	return shopDomainRegex.test(normalizedShop) ? normalizedShop : null;
}

const shopDomainRegex = /^[a-z0-9][a-z0-9-_]*\.myshopify\.com$/;
