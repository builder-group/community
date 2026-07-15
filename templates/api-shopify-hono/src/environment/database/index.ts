import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { databaseConfig } from '../configs';
import * as schema from './schema';

export const databasePool = new Pool({
	connectionString: databaseConfig.url
});

export const db = drizzle({
	client: databasePool,
	schema
});

export * from './schema';
