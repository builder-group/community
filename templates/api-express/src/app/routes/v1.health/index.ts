import { appConfig } from '@/environment';
import type { TApiRouter } from '..';

export function registerHealthRoute(router: TApiRouter): void {
	router.get('/v1/health', {
		handler: (_request, response) => {
			response.status(200).json({ status: 'ok', version: appConfig.version });
		}
	});
}
