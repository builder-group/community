import { z } from 'zod';
import { greet } from '@/modules/greet';
import type { TApiRouter } from '..';

export function registerGreetRoute(router: TApiRouter): void {
	router.get('/v1/greet', {
		querySchema: z.object({
			name: z.string().trim().min(1).default('Builder')
		}),
		handler: (request, response) => {
			const { name = 'Builder' } = request.valid.query;

			response.status(200).json({ message: greet(name) });
		}
	});
}
