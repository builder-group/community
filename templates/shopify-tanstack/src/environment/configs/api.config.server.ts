import { emptyStringAsUndefined, validateEnv } from 'validatenv';
import { z } from 'zod';

const environment = validateEnv(process.env, {
	url: {
		envKey: 'API_URL',
		validator: z
			.url({ protocol: /^https?$/ })
			.transform((value) => new URL(value))
			.optional(),
		preprocess: emptyStringAsUndefined
	}
});

export const apiConfig = {
	proxyUrl: environment.url
} as const;
