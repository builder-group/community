import { createOpenApiFetchClient, type TFetchClient } from 'feature-fetch';

import type { paths } from './gen/v1';
import { withEPREL } from './with-eprel';

export function createEPRELClient(
	config: TEPRELClientConfig
): TFetchClient<['base', 'openapi', 'eprel'], paths> {
	const { prefixUrl = 'https://eprel.ec.europa.eu/api', apiKey } = config;
	return withEPREL(
		createOpenApiFetchClient<paths>({
			prefixUrl,
			beforeRequestMiddlewares:
				apiKey != null
					? [
							(data) => {
								data.requestInit.headers['x-api-key'] = [apiKey];
							}
						]
					: undefined
		})
	);
}

export interface TEPRELClientConfig {
	prefixUrl?: string;
	apiKey?: string;
}
