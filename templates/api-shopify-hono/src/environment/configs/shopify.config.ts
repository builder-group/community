import { ApiVersion } from '@shopify/shopify-api';

const apiVersion = ApiVersion.July26;

export const shopifyConfig = {
	apiVersion,
	adminApiUrl: (shop: string) => `https://${shop}/admin/api/${apiVersion}/graphql.json`
} as const;
