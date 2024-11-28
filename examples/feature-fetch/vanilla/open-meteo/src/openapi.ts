import { createOpenApiFetchClient } from 'feature-fetch';
import { type paths } from './gen/v1';

const openApiFetchClient = createOpenApiFetchClient<paths>({
	prefixUrl: 'https://api.open-meteo.com/'
});

export async function fetchWeatherWithOpenApiFetchClient(latitude: number, longitude: number) {
	const result = await openApiFetchClient.get('/v1/forecast', {
		queryParams: {
			latitude,
			longitude
		}
	});

	// Handle response
	if (result.isOk()) {
		console.log('[openapi] Ok Result', { data: result.value.data });
	} else {
		console.error('[openapi] Error Result', { error: result.error });
	}

	// Or unwrap the response, throwing an exception on error
	try {
		const data = result.unwrap().data;
		console.log('[openapi/unwrap] Ok Result', { data });
	} catch (error) {
		console.error('[openapi/unwrap] Error Result', { error });
	}
}
