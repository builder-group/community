/// <reference types="node" />

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'drizzle-kit';
import { validateEnv } from 'validatenv';
import { z } from 'zod';

// eslint-disable-next-line turbo/no-undeclared-env-vars -- Drizzle commands run outside Turbo's task graph
if (process.env['DATABASE_URL'] == null && existsSync('.env.local')) {
	loadEnvFile('.env.local');
}

const environment = validateEnv(process.env, {
	databaseUrl: {
		envKey: 'DATABASE_URL',
		validator: z.url({ protocol: /^postgres(?:ql)?$/ })
	}
});

export default defineConfig({
	schema: './src/environment/database/schema/index.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: environment.databaseUrl
	},
	strict: true,
	verbose: true
});
