import type { TShopifyOfflineToken } from '../token';
import { createShopifyAdminApiClient, type TShopifyAdminApiClient } from './api-client';

export class ShopifyInstallationCx {
	public readonly installationId: string;
	public readonly shop: string;
	public readonly accessToken: string;
	public readonly apiClient: TShopifyAdminApiClient;

	private constructor(installationId: string, shop: string, accessToken: string) {
		this.installationId = installationId;
		this.shop = shop;
		this.accessToken = accessToken;
		this.apiClient = createShopifyAdminApiClient({ shop, accessToken });
	}

	public static fromOfflineToken(token: TShopifyOfflineToken): ShopifyInstallationCx {
		return new ShopifyInstallationCx(token.installationId, token.shop, token.accessToken);
	}
}
