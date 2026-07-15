import { Err, Ok, type TResult } from 'tuple-result';
import { shopify } from '@/environment';
import { AppError } from '@/modules/error';
import { resolveShopifyOfflineToken } from '../offline-token';
import { ShopifyAdminCx } from './ShopifyAdminCx';

// https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript#validate-the-session-token
export async function authenticateShopifyAdmin(
	sessionToken: string
): Promise<TResult<ShopifyAdminCx, AppError>> {
	let shop: string;
	try {
		const payload = await shopify.session.decodeSessionToken(sessionToken);
		const sanitizedShop = shopify.utils.sanitizeShop(new URL(payload.dest).hostname);
		if (sanitizedShop == null) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
					status: 401,
					title: 'Unauthorized',
					detail: 'The Shopify session token could not be verified'
				})
			);
		}
		shop = sanitizedShop;
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
				status: 401,
				title: 'Unauthorized',
				detail: 'The Shopify session token could not be verified',
				cause
			})
		);
	}

	const [isOfflineTokenOk, offlineTokenErr, offlineToken] = await resolveShopifyOfflineToken(
		shop,
		sessionToken
	);
	if (!isOfflineTokenOk) {
		return Err(offlineTokenErr);
	}

	return Ok(ShopifyAdminCx.fromOfflineToken(offlineToken));
}
