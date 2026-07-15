import { createMiddleware } from 'hono/factory';
import { shopifyConfig } from '@/environment';
import { AppError } from '@/modules/error';
import {
	authenticateShopifyAdmin,
	invalidateShopifyOfflineAccessToken,
	type ShopifyAdminCx
} from '@/modules/shopify';

export const shopifyAdminAuth = createMiddleware<{
	Variables: { shopifyAdminCx: ShopifyAdminCx };
}>(async (context, next) => {
	const authorization = context.req.header('Authorization');
	if (authorization == null) {
		throw new AppError('#ERR_SHOPIFY_SESSION_TOKEN_REQUIRED', {
			status: 401,
			title: 'Unauthorized',
			detail: 'A Shopify session token is required in the Authorization header'
		});
	}

	const sessionToken = authorization.match(/^Bearer\s+(\S+)$/i)?.[1];
	if (sessionToken == null) {
		throw new AppError('#ERR_SHOPIFY_AUTHORIZATION_INVALID', {
			status: 401,
			title: 'Unauthorized',
			detail: 'Authorization header must use the Bearer scheme'
		});
	}

	const [isShopifyAdminCxOk, shopifyAdminCxErr, shopifyAdminCx] =
		await authenticateShopifyAdmin(sessionToken);
	if (!isShopifyAdminCxOk) {
		if (shopifyAdminCxErr.code === '#ERR_SHOPIFY_SESSION_TOKEN_INVALID') {
			context.header(shopifyConfig.sessionToken.retryHeader, '1');
		}
		throw shopifyAdminCxErr;
	}

	context.set('shopifyAdminCx', shopifyAdminCx);
	try {
		await next();
	} catch (cause) {
		if (cause instanceof AppError && cause.code === '#ERR_SHOPIFY_ADMIN_ACCESS_TOKEN_INVALID') {
			const [isAccessTokenInvalidated, accessTokenInvalidationErr] =
				await invalidateShopifyOfflineAccessToken(
				shopifyAdminCx.shopifyInstallationId,
				shopifyAdminCx.accessToken
			);
			if (!isAccessTokenInvalidated) {
				throw accessTokenInvalidationErr;
			}

			context.header(shopifyConfig.sessionToken.retryHeader, '1');
			throw new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
				status: 401,
				title: 'Unauthorized',
				detail: 'The Shopify session must be refreshed',
				cause
			});
		}

		throw cause;
	}
});
