import { RequestedTokenType, type Session } from '@shopify/shopify-api';
import { createMiddleware } from 'hono/factory';
import { AppError } from '@/api/modules/error';
import type { TApiEnv } from '@/api/types';
import { getShopify, getShopifySessionStorage } from './shopify';

export const shopifyAdminAuth = createMiddleware<TApiEnv>(async (context, next) => {
	const authorization = context.req.header('Authorization');
	const sessionToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

	if (sessionToken == null || sessionToken.length === 0) {
		throw unauthorizedError();
	}

	try {
		const shopify = getShopify();
		const payload = await shopify.session.decodeSessionToken(sessionToken);
		const shop = shopify.utils.sanitizeShop(new URL(payload.dest).hostname, true);
		if (shop == null) {
			throw unauthorizedError();
		}

		const session = await loadOrCreateOfflineSession(shop, sessionToken);
		context.set('shopify', {
			admin: new shopify.clients.Graphql({ session }),
			session,
			shop
		});
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}

		throw unauthorizedError(error);
	}

	await next();
});

async function loadOrCreateOfflineSession(shop: string, sessionToken: string): Promise<Session> {
	const shopify = getShopify();
	const sessionStorage = getShopifySessionStorage();
	const sessionId = shopify.session.getOfflineId(shop);
	const storedSession = await sessionStorage.loadSession(sessionId);
	if (storedSession != null) {
		return storedSession;
	}

	const { session } = await shopify.auth.tokenExchange({
		shop,
		sessionToken,
		requestedTokenType: RequestedTokenType.OfflineAccessToken
	});
	await sessionStorage.storeSession(session);

	return session;
}

function unauthorizedError(cause?: unknown): AppError {
	return new AppError('#ERR_SHOPIFY_UNAUTHORIZED', {
		status: 401,
		title: 'Unauthorized',
		detail: 'A valid Shopify session token is required',
		cause
	});
}
