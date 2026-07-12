import { createMiddleware } from 'hono/factory';
import { shopifyConfig } from '@/environment';
import { AppError } from '@/modules/error';
import { authenticateShopifyAdmin, type ShopifyAdminCx } from '@/modules/shopify';

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
	await next();
});
