import { greet } from '@/modules/greet';
import type { TApiRouter } from '..';
import { SGreetQuery } from './schema';

export function registerGreetRoute(router: TApiRouter): void {
	router.get('/v1/greet', {
		querySchema: SGreetQuery,
		handler: (request, response) => {
			const { name = 'Builder' } = request.valid.query;

			response.status(200).json({ message: greet(name) });
		}
	});
}
