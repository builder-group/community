import type { Session } from '@shopify/shopify-api';
import { Err, Ok, type TResult } from 'tuple-result';
import { AppError } from '@/modules/error';
import { createShopifyAdminApiClient, type TShopifyAdminApiClient } from './api-client';

export class ShopifyAdminCx {
	public readonly sessionId: string;
	public readonly shop: string;
	public readonly accessToken: string;
	public readonly apiClient: TShopifyAdminApiClient;

	private constructor(sessionId: string, shop: string, accessToken: string) {
		this.sessionId = sessionId;
		this.shop = shop;
		this.accessToken = accessToken;
		this.apiClient = createShopifyAdminApiClient({ shop, accessToken });
	}

	public static fromSession(session: Session): TResult<ShopifyAdminCx, AppError> {
		const { shop, accessToken } = session;
		if (accessToken == null || !accessToken.length) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_INVALID', {
					status: 401,
					title: 'Unauthorized',
					detail: 'The Shopify session does not contain an access token'
				})
			);
		}

		return Ok(new ShopifyAdminCx(session.id, shop, accessToken));
	}
}
