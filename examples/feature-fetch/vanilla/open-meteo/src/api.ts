import { createApiFetchClient } from 'feature-fetch';
import { paths } from './gen/v1';

const apiFetchClient = createApiFetchClient({ prefixUrl: 'https://api.open-meteo.com/' });

export async function fetchWeatherWithApiFetchClient(latitude: number, longitude: number) {
	const result = await apiFetchClient.get<
		paths['/v1/forecast']['get']['responses']['200']['content']['application/json']
	>('/v1/forecast', {
		queryParams: {
			latitude,
			longitude
		}
	});

	// Handle response
	if (result.isOk()) {
		console.log('[api] Ok Result', { data: result.value.data });
	} else {
		console.error('[api] Error Result', { error: result.error });
	}

	// Or unwrap the response, throwing an exception on error
	try {
		const data = result.unwrap().data;
		console.log('[api/unwrap] Ok Result', { data });
	} catch (error) {
		console.error('[api/unwrap] Error Result', { error });
	}
}
