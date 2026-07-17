import { createGraphQLFetchClient } from 'feature-fetch';
import { shopifyConfig } from '@/environment';

export function createShopifyAdminApiClient(
	options: TCreateShopifyAdminApiClientOptions
): TShopifyAdminApiClient {
	const { shop, accessToken } = options;

	return createGraphQLFetchClient({
		baseUrl: shopifyConfig.admin.graphqlUrl(shop),
		headers: {
			'X-Shopify-Access-Token': accessToken
		}
	});
}

interface TCreateShopifyAdminApiClientOptions {
	shop: string;
	accessToken: string;
}

export type TShopifyAdminApiClient = ReturnType<typeof createGraphQLFetchClient>;
