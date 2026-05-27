import { createOpenApiFetchClient } from 'feature-fetch';
import type { paths } from './gen/open-meteo-v1';

const openApiFetchClient = createOpenApiFetchClient<paths>({
	baseUrl: 'https://api.open-meteo.com'
});

export async function fetchWeatherWithOpenApiFetchClient(
	latitude: number,
	longitude: number
): Promise<void> {
	const [isOk, error, forecast] = await openApiFetchClient.get('/v1/forecast', {
		queryParams: {
			latitude,
			longitude,
			current_weather: true
		}
	});

	if (!isOk) {
		console.error('[openapi] Error Result', { error });
		return;
	}

	console.log('[openapi] Ok Result', { forecast });
}
