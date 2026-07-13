import { createServerFn } from '@tanstack/react-start';
import { shopifyConfig } from '@/environment/configs/shopify.config.server';

export const getPublicShopifyConfig = createServerFn({ method: 'GET' }).handler(() => ({
	apiKey: shopifyConfig.apiKey
}));
