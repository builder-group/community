import { createOpenApiFetchClient, type TFetchClient } from 'feature-fetch';

import type { paths } from './gen/v1';
import { withEPREL } from './with-eprel';

export function createEPRELClient(
	options: TEPRELClientOptions = {}
): TFetchClient<['base', 'openapi', 'eprel'], paths> {
	const { prefixUrl = 'https://eprel.ec.europa.eu/api', apiKey } = options;
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

export interface TEPRELClientOptions {
	prefixUrl?: string;
	apiKey?: string;
}
