import type { TShopifyOfflineToken } from '../offline-token';
import { createShopifyAdminApiClient, type TShopifyAdminApiClient } from './api-client';

export class ShopifyAdminCx {
	public readonly shopifyInstallationId: string;
	public readonly shop: string;
	public readonly accessToken: string;
	public readonly apiClient: TShopifyAdminApiClient;

	private constructor(shopifyInstallationId: string, shop: string, accessToken: string) {
		this.shopifyInstallationId = shopifyInstallationId;
		this.shop = shop;
		this.accessToken = accessToken;
		this.apiClient = createShopifyAdminApiClient({ shop, accessToken });
	}

	public static fromOfflineToken(token: TShopifyOfflineToken): ShopifyAdminCx {
		return new ShopifyAdminCx(token.shopifyInstallationId, token.shop, token.accessToken);
	}
}
