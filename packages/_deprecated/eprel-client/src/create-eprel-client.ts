import { createOpenApiFetchClient, TOpenApiFeature, type TFetchClient } from 'feature-fetch';
import type { paths } from './gen/v1';
import { TEPRELFeature } from './types';
import { withEPREL } from './with-eprel';

export function createEPRELClient(
	options: TEPRELClientOptions = {}
): TFetchClient<[TOpenApiFeature<paths>, TEPRELFeature]> {
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
