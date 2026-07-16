import { createShopifyAdminApiClient, type TShopifyAdminApiClient } from './api-client';
import type { TShopifyOnlineToken, TShopifyUser } from './token';

export class ShopifyUserCx {
	public readonly installationId: string;
	public readonly shop: string;
	public readonly shopifyUser: TShopifyUser;
	public readonly accessToken: string;
	public readonly scopes: string[];
	public readonly associatedUserScopes: string[];
	public readonly apiClient: TShopifyAdminApiClient;

	private constructor(token: TShopifyOnlineToken) {
		this.installationId = token.installationId;
		this.shop = token.shop;
		this.shopifyUser = token.shopifyUser;
		this.accessToken = token.accessToken;
		this.scopes = token.scopes;
		this.associatedUserScopes = token.associatedUserScopes;
		this.apiClient = createShopifyAdminApiClient({
			shop: token.shop,
			accessToken: token.accessToken
		});
	}

	public static fromOnlineToken(token: TShopifyOnlineToken): ShopifyUserCx {
		return new ShopifyUserCx(token);
	}
}
