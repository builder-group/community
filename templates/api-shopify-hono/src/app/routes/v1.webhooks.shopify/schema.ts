import { createRoute, z } from '@hono/zod-openapi';
import { createErrorResponse } from '@/modules/error';
import { shopifyWebhookTopics } from '@/modules/shopify';
import { createShopifyWebhookAuth } from '../../middleware';

// https://shopify.dev/docs/api/webhooks/latest?accordionItem=webhooks-app-uninstalled&reference=toml
export const AppUninstalledWebhookRoute = createRoute({
	method: 'post',
	path: '/v1/webhooks/shopify/app/uninstalled',
	tags: ['webhooks', 'shopify'],
	summary: 'Handle an app uninstalled webhook',
	operationId: 'handleAppUninstalledWebhook',
	middleware: [createShopifyWebhookAuth(shopifyWebhookTopics.appUninstalled)] as const,
	request: {
		body: {
			required: true,
			content: {
				'application/json': {
					schema: z.looseObject({}).openapi('AppUninstalledWebhookPayload')
				}
			}
		}
	},
	responses: {
		200: { description: 'The webhook was acknowledged' },
		400: createErrorResponse('The webhook request is invalid'),
		401: createErrorResponse('The webhook could not be verified'),
		500: createErrorResponse('The webhook could not be processed'),
		503: createErrorResponse('Shopify session storage is unavailable')
	}
});

// https://shopify.dev/docs/api/webhooks/latest?accordionItem=webhooks-app-scopes_update&reference=toml
export const AppScopesUpdateWebhookRoute = createRoute({
	method: 'post',
	path: '/v1/webhooks/shopify/app/scopes-update',
	tags: ['webhooks', 'shopify'],
	summary: 'Handle an app scopes update webhook',
	operationId: 'handleAppScopesUpdateWebhook',
	middleware: [createShopifyWebhookAuth(shopifyWebhookTopics.appScopesUpdate)] as const,
	request: {
		body: {
			required: true,
			content: {
				'application/json': {
					schema: z
						.looseObject({
							id: z.number().openapi({ example: 1 }),
							shop_id: z.string().openapi({ example: 'gid://shopify/Shop/548380009' }),
							previous: z.array(z.string()).openapi({ example: ['read_products'] }),
							current: z
								.array(z.string())
								.openapi({ example: ['read_products', 'write_products'] }),
							updated_at: z.iso.datetime().openapi({ example: '2024-06-25T00:00:00.000Z' })
						})
						.openapi('AppScopesUpdateWebhookPayload')
				}
			}
		}
	},
	responses: {
		200: { description: 'The webhook was acknowledged' },
		400: createErrorResponse('The webhook request is invalid'),
		401: createErrorResponse('The webhook could not be verified'),
		500: createErrorResponse('The webhook could not be processed'),
		503: createErrorResponse('Shopify session storage is unavailable')
	}
});

// https://shopify.dev/docs/api/webhooks/latest?accordionItem=webhooks-customers-data_request&reference=toml
export const CustomersDataRequestWebhookRoute = createRoute({
	method: 'post',
	path: '/v1/webhooks/shopify/customers/data-request',
	tags: ['webhooks', 'shopify'],
	summary: 'Handle a customer data request webhook',
	operationId: 'handleCustomersDataRequestWebhook',
	middleware: [createShopifyWebhookAuth(shopifyWebhookTopics.customersDataRequest)] as const,
	request: {
		body: {
			required: true,
			content: {
				'application/json': {
					schema: z.looseObject({}).openapi('CustomersDataRequestWebhookPayload')
				}
			}
		}
	},
	responses: {
		200: { description: 'The webhook was acknowledged' },
		400: createErrorResponse('The webhook request is invalid'),
		401: createErrorResponse('The webhook could not be verified'),
		500: createErrorResponse('The webhook could not be processed')
	}
});

// https://shopify.dev/docs/api/webhooks/latest?accordionItem=webhooks-customers-redact&reference=toml
export const CustomersRedactWebhookRoute = createRoute({
	method: 'post',
	path: '/v1/webhooks/shopify/customers/redact',
	tags: ['webhooks', 'shopify'],
	summary: 'Handle a customer redaction webhook',
	operationId: 'handleCustomersRedactWebhook',
	middleware: [createShopifyWebhookAuth(shopifyWebhookTopics.customersRedact)] as const,
	request: {
		body: {
			required: true,
			content: {
				'application/json': {
					schema: z.looseObject({}).openapi('CustomersRedactWebhookPayload')
				}
			}
		}
	},
	responses: {
		200: { description: 'The webhook was acknowledged' },
		400: createErrorResponse('The webhook request is invalid'),
		401: createErrorResponse('The webhook could not be verified'),
		500: createErrorResponse('The webhook could not be processed')
	}
});

// https://shopify.dev/docs/api/webhooks/latest?accordionItem=webhooks-shop-redact&reference=toml
export const ShopRedactWebhookRoute = createRoute({
	method: 'post',
	path: '/v1/webhooks/shopify/shop/redact',
	tags: ['webhooks', 'shopify'],
	summary: 'Handle a shop redaction webhook',
	operationId: 'handleShopRedactWebhook',
	middleware: [createShopifyWebhookAuth(shopifyWebhookTopics.shopRedact)] as const,
	request: {
		body: {
			required: true,
			content: {
				'application/json': {
					schema: z.looseObject({}).openapi('ShopRedactWebhookPayload')
				}
			}
		}
	},
	responses: {
		200: { description: 'The webhook was acknowledged' },
		400: createErrorResponse('The webhook request is invalid'),
		401: createErrorResponse('The webhook could not be verified'),
		500: createErrorResponse('The webhook could not be processed'),
		503: createErrorResponse('Shopify session storage is unavailable')
	}
});
