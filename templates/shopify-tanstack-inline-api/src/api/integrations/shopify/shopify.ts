import { ApiVersion, shopifyApi, type Shopify } from '@shopify/shopify-api';
import { webApiAdapterInitialized } from '@shopify/shopify-api/adapters/web-api';
import { MemorySessionStorage } from '@shopify/shopify-app-session-storage-memory';
import { z } from 'zod';

const memorySessionStorage = new MemorySessionStorage();

let shopify: Shopify | undefined;

// Initialize lazily so OpenAPI generation and builds do not require Shopify runtime credentials
export function getShopify(): Shopify {
	shopify ??= createShopify();
	return shopify;
}

export function getShopifySessionStorage(): MemorySessionStorage {
	if (process.env['NODE_ENV'] === 'production') {
		throw new Error(
			'MemorySessionStorage is development-only. Configure persistent storage first.'
		);
	}

	return memorySessionStorage;
}

function createShopify(): Shopify {
	// Referencing the marker prevents server bundlers from removing the adapter side effect
	if (!webApiAdapterInitialized) {
		throw new Error('The Shopify Web API adapter could not be initialized.');
	}

	const environment = z
		.object({
			SHOPIFY_API_KEY: z.string().min(1),
			SHOPIFY_API_SECRET: z.string().min(1),
			SCOPES: z.string().default(''),
			SHOPIFY_APP_URL: z.url()
		})
		.parse(process.env);
	const appUrl = new URL(environment.SHOPIFY_APP_URL);

	return shopifyApi({
		apiKey: environment.SHOPIFY_API_KEY,
		apiSecretKey: environment.SHOPIFY_API_SECRET,
		apiVersion: ApiVersion.July26,
		hostName: appUrl.host,
		hostScheme: appUrl.protocol === 'http:' ? 'http' : 'https',
		isEmbeddedApp: true,
		scopes: environment.SCOPES.split(',')
			.map((scope) => scope.trim())
			.filter((scope) => scope.length > 0)
	});
}
