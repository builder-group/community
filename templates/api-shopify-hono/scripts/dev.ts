import { serve } from '@hono/node-server';
import { createApi } from '../src';
import { logger } from '../src/environment';

const api = createApi();

serve(
	{
		fetch: api.fetch,
		port: 8787
	},
	(info) => {
		logger.info(`API Hono is running at http://localhost:${info.port}`);
	}
);
