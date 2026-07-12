import { ApiVersion } from '@shopify/shopify-api';
import { emptyStringAsUndefined, validateEnv, type TEnv } from 'validatenv';
import { z } from 'zod';

const apiVersion = ApiVersion.July26;

const environment = validateEnv(process.env, {
	apiKey: {
		envKey: 'SHOPIFY_API_KEY',
		validator: z.string().min(1)
	},
	apiSecretKey: {
		envKey: 'SHOPIFY_API_SECRET',
		validator: z.string().min(1)
	},
	appUrl: {
		envKey: 'SHOPIFY_APP_URL',
		validator: z.url({ protocol: /^https?$/ }).transform((value) => new URL(value))
	},
	scopes: {
		envKey: 'SHOPIFY_SCOPES',
		validator: z.string().transform((value) =>
			value
				.split(',')
				.map((scope) => scope.trim())
				.filter((scope) => scope.length > 0)
		),
		preprocess: emptyStringAsUndefined,
		defaultValue: (env: TEnv) => {
			// Note: Shopify CLI injects SCOPES from shopify.app.toml during app dev
			return emptyStringAsUndefined(env['SCOPES']) ?? '';
		}
	}
});

export const shopifyConfig = {
	apiKey: environment.apiKey,
	apiSecretKey: environment.apiSecretKey,
	appUrl: environment.appUrl,
	scopes: environment.scopes,
	apiVersion,
	sessionToken: {
		// Note: App Bridge retries XHR requests with a fresh session token when this header is returned
		retryHeader: 'X-Shopify-Retry-Invalid-Session-Request'
	},
	admin: {
		expiringOfflineAccessTokens: true,
		graphqlUrl: (shop: string) => `https://${shop}/admin/api/${apiVersion}/graphql.json`
	}
} as const;
