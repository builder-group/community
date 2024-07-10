import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { router } from './router';

const app = new Hono();

const port = 3000;
console.log(`Server is running on port ${port}`);

app.route('/', router);

serve({
	fetch: app.fetch,
	port
});
