import type { OpenAPIHono } from '@hono/zod-openapi';
import { greet } from '@/modules/greet';
import { GreetRoute } from './schema';

export function registerGreetRoute(router: OpenAPIHono): void {
	router.openapi(GreetRoute, (context) => {
		const { name } = context.req.valid('query');

		return context.json({ message: greet(name) }, 200);
	});
}
