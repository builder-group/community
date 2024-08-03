import { createOpenApiFetchClient } from 'feature-fetch';

import { type paths } from './gen/v1';

const fetchClient = createOpenApiFetchClient<paths>({
	prefixUrl: 'https://api.open-meteo.com/'
});

const result = await fetchClient.get('/v1/forecast', {
	queryParams: {
		latitude: 52.52,
		longitude: 13.41
	}
});

if (result.isOk()) {
	console.log('Ok Result', { data: result.value.data });
} else {
	console.error('Error Result', { error: result.error });
}
