import { createOpenApiFetchClient, type TFetchClient } from 'feature-fetch';
import type { paths } from './gen/v1';
import { withGoogleWebfonts } from './with-google-webfonts';

export function createGoogleWebfontsClient(
	config: TGoogleWebfontsClientConfig
): TFetchClient<['base', 'openapi', 'google-webfonts'], paths> {
	const { prefixUrl = 'https://www.googleapis.com/webfonts/v1', apiKey } = config;
	return withGoogleWebfonts(
		createOpenApiFetchClient<paths>({
			prefixUrl,
			beforeRequestMiddlewares: [
				(data) => {
					data.queryParams['key'] = apiKey;
				}
			]
		})
	);
}

export interface TGoogleWebfontsClientConfig {
	prefixUrl?: string;
	apiKey: string;
}
