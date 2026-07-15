import { shopifyApi, type Shopify } from '@shopify/shopify-api';
import { shopifyConfig } from './configs';
// Note: Shopify requires the Web API runtime adapter before the client is initialized
// https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api#getting-started
import '@shopify/shopify-api/adapters/web-api';

export const shopify: Shopify = shopifyApi({
	apiKey: shopifyConfig.apiKey,
	apiSecretKey: shopifyConfig.apiSecretKey,
	apiVersion: shopifyConfig.apiVersion,
	scopes: shopifyConfig.scopes,
	hostName: shopifyConfig.appUrl.host,
	hostScheme: shopifyConfig.appUrl.protocol === 'http:' ? 'http' : 'https',
	isEmbeddedApp: true
});
