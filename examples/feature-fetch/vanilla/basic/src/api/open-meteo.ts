import { createApiFetchClient } from 'feature-fetch';

const apiFetchClient = createApiFetchClient({
	baseUrl: 'https://api.open-meteo.com'
});

export async function fetchWeatherWithApiFetchClient(
	latitude: number,
	longitude: number
): Promise<void> {
	const [isOk, error, forecast] = await apiFetchClient.get<TForecastResponse, TForecastError>(
		'/v1/forecast',
		{
			queryParams: {
				latitude,
				longitude,
				current_weather: true
			}
		}
	);

	if (!isOk) {
		console.error('[api] Error Result', { error });
		return;
	}

	console.log('[api] Ok Result', { forecast });
}

export interface TForecastResponse {
	current_weather?: {
		time: string;
		temperature: number;
		windspeed: number;
		winddirection: number;
		weathercode: number;
	};
}

export interface TForecastError {
	error?: boolean;
	reason?: string;
}
