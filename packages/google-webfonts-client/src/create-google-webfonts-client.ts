import { createOpenApiFetchClient, type TFetchClient } from 'feature-fetch';

import type { paths } from './gen/v1';
import { withGoogle } from './with-google-webfonts';

export function createGoogleWebfontsClient(
	config: TGoogleClientConfig
): TFetchClient<['base', 'openapi', 'google-webfonts'], paths> {
	const { prefixUrl = 'https://www.googleapis.com/webfonts/v1', apiKey } = config;
	return withGoogle(
		createOpenApiFetchClient<paths>({
			prefixUrl,
			beforeRequestMiddlewares: [
				async (data) => {
					const { queryParams } = data;
					const newQueryParams = queryParams ?? {};
					newQueryParams.key = apiKey;
					return { queryParams: newQueryParams };
				}
			]
		})
	);
}

export interface TGoogleClientConfig {
	prefixUrl?: string;
	apiKey: string;
}
