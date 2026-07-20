import { emptyStringAsUndefined, validateEnv } from 'validatenv';
import { z } from 'zod';
import { version as packageVersion } from '../../../package.json';

const environment = validateEnv(process.env, {
	nodeEnv: {
		envKey: 'NODE_ENV',
		validator: z.enum(['development', 'production', 'test']),
		defaultValue: 'development'
	},
	corsOrigin: {
		envKey: 'API_CORS_ORIGIN',
		validator: z
			.url({ protocol: /^https?$/ })
			.transform((value) => new URL(value).origin)
			.optional(),
		preprocess: emptyStringAsUndefined
	}
});

export const appConfig = {
	name: 'API Express',
	environment: environment.nodeEnv,
	version: `${packageVersion}${environment.nodeEnv.slice(0, 1).toLowerCase()}`,
	packageVersion,
	cors: {
		origin: environment.corsOrigin
	}
} as const;
