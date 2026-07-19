/// <reference types="node" />

import { defineConfig } from 'drizzle-kit';
import { validateEnv } from 'validatenv';
import { z } from 'zod';

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
