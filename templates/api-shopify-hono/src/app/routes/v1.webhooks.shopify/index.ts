import type { OpenAPIHono } from '@hono/zod-openapi';
import {
	redactShopifyInstallation,
	uninstallShopifyInstallation,
	updateShopifyInstallationScopes
} from '@/modules/shopify';
import {
	AppScopesUpdateWebhookRoute,
	AppUninstalledWebhookRoute,
	CustomersDataRequestWebhookRoute,
	CustomersRedactWebhookRoute,
	ShopRedactWebhookRoute
} from './schema';

export function registerShopifyWebhookRoutes(router: OpenAPIHono): void {
	router.openapi(AppUninstalledWebhookRoute, async (context) => {
		const { shopifyWebhook } = context.var;
		const [isInstallationUninstalled, installationErr] = await uninstallShopifyInstallation(
			shopifyWebhook.shop,
			shopifyWebhook.triggeredAt
		);
		if (!isInstallationUninstalled) {
			throw installationErr;
		}

		return context.body(null, 200);
	});

	router.openapi(AppScopesUpdateWebhookRoute, async (context) => {
		const { shopifyWebhook } = context.var;
		const { current, updated_at: scopesUpdatedAt } = context.req.valid('json');
		const [areScopesUpdated, scopesErr] = await updateShopifyInstallationScopes(
			shopifyWebhook.shop,
			current,
			new Date(scopesUpdatedAt)
		);
		if (!areScopesUpdated) {
			throw scopesErr;
		}

		return context.body(null, 200);
	});

	router.openapi(CustomersDataRequestWebhookRoute, (context) => {
		// Note: This template stores no customer data. Add data export behavior when customer persistence is introduced
		return context.body(null, 200);
	});

	router.openapi(CustomersRedactWebhookRoute, (context) => {
		// Note: This template stores no customer data. Add redaction behavior when customer persistence is introduced
		return context.body(null, 200);
	});

	router.openapi(ShopRedactWebhookRoute, async (context) => {
		const { shopifyWebhook } = context.var;
		const [isInstallationRedacted, installationErr] = await redactShopifyInstallation(
			shopifyWebhook.shop,
			shopifyWebhook.triggeredAt
		);
		if (!isInstallationRedacted) {
			throw installationErr;
		}

		// Note: Delete other shop-owned data here when the application introduces persistent storage
		return context.body(null, 200);
	});
}
