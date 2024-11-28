import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { errorHandler, invalidPathHandler } from './handlers';
import { router } from './router';

const port = 3000;

const app = new Hono();

app.onError(errorHandler);
app.notFound(invalidPathHandler);
app.route('/', router);

console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port
});
