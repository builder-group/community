import { fetchWeatherWithApiFetchClient } from './api';
import { fetchWeatherWithOpenApiFetchClient } from './openapi';

await fetchWeatherWithApiFetchClient(52.52, 13.41);
await fetchWeatherWithOpenApiFetchClient(52.52, 13.41);
