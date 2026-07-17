import { createMiddleware } from 'hono/factory';
import { shopifyConfig } from '@/environment';
import { AppError } from '@/modules/error';
import {
	authenticateShopifyUser,
	invalidateShopifyOnlineAccessToken,
	type ShopifyUserCx
} from '@/modules/shopify';

export const shopifyUserAuth = createMiddleware<{
	Variables: { shopifyUserCx: ShopifyUserCx };
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

	const [isShopifyUserCxOk, shopifyUserCxErr, shopifyUserCx] =
		await authenticateShopifyUser(sessionToken);
	if (!isShopifyUserCxOk) {
		if (shopifyUserCxErr.code === '#ERR_SHOPIFY_SESSION_TOKEN_INVALID') {
			// Note: App Bridge may safely retry because application behavior has not started yet
			context.header(shopifyConfig.sessionToken.retryHeader, '1');
		}
		throw shopifyUserCxErr;
	}

	context.set('shopifyUserCx', shopifyUserCx);
	try {
		await next();
	} catch (cause) {
		if (cause instanceof AppError && cause.code === '#ERR_SHOPIFY_ADMIN_ACCESS_TOKEN_INVALID') {
			const [isAccessTokenInvalidated, accessTokenInvalidationErr] =
				await invalidateShopifyOnlineAccessToken(
					shopifyUserCx.shopifyUser.id,
					shopifyUserCx.accessToken
				);
			if (!isAccessTokenInvalidated) {
				throw accessTokenInvalidationErr;
			}

			// Note: Do not request automatic replay here because application behavior may already have
			// produced side effects
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
