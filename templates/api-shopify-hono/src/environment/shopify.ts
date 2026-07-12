import { shopifyApi, type Shopify } from '@shopify/shopify-api';
import type { SessionStorage } from '@shopify/shopify-app-session-storage';
import { MemorySessionStorage } from '@shopify/shopify-app-session-storage-memory';
import { appConfig, shopifyConfig } from './configs';
// Register Shopify's adapter for standard Web API Request and Response objects
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

export const shopifySessionStorage: SessionStorage = (() => {
	if (appConfig.environment === 'production') {
		throw new Error(
			'MemorySessionStorage is development-only. Configure persistent Shopify session storage before running in production.'
		);
	}
	return new MemorySessionStorage();
})();
