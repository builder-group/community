import { validateEnv } from 'validatenv';
import { z } from 'zod';

const environment = validateEnv(process.env, {
	url: {
		envKey: 'DATABASE_URL',
		validator: z.url({ protocol: /^postgres(?:ql)?$/ })
	}
});

export const databaseConfig = {
	url: environment.url
} as const;
