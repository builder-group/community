import { serve } from '@hono/node-server';
import { createApi } from '../src';

const api = createApi();

serve(
	{
		fetch: api.fetch,
		port: 8787
	},
	(info) => {
		console.log(`API Hono is running at http://localhost:${info.port}`);
	}
);
