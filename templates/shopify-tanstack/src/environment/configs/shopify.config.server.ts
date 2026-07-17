import { validateEnv } from 'validatenv';
import { z } from 'zod';

const environment = validateEnv(process.env, {
	apiKey: {
		envKey: 'SHOPIFY_API_KEY',
		validator: z.string().min(1)
	}
});

export const shopifyConfig = {
	apiKey: environment.apiKey
} as const;
