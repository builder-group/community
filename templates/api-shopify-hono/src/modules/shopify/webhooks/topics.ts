export const shopifyWebhookTopics = {
	appUninstalled: 'APP_UNINSTALLED',
	appScopesUpdate: 'APP_SCOPES_UPDATE',
	customersDataRequest: 'CUSTOMERS_DATA_REQUEST',
	customersRedact: 'CUSTOMERS_REDACT',
	shopRedact: 'SHOP_REDACT'
} as const;

export type TShopifyWebhookTopic = (typeof shopifyWebhookTopics)[keyof typeof shopifyWebhookTopics];
