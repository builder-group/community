import { emptyStringAsUndefined, validateEnv, validateEnvVar } from 'validatenv';
import { z } from 'zod';

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

const packageVersion = validateEnvVar(
	{
		// @ts-expect-error -- Replaced with package.json version by Rollup/esbuild during builds
		// eslint-disable-next-line turbo/no-undeclared-env-vars -- Replaced with package metadata during builds
		npm_package_version: process.env.npm_package_version
	},
	'npm_package_version',
	{
		validator: z.string().min(1),
		defaultValue: '0.0.0'
	}
);

export const appConfig = {
	name: 'API Hono',
	environment: environment.nodeEnv,
	version: `${packageVersion}${environment.nodeEnv.slice(0, 1).toLowerCase()}`,
	packageVersion,
	cors: {
		origin: environment.corsOrigin
	}
} as const;
