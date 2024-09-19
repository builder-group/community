import { createOpenApiFetchClient, type TFetchClient } from 'feature-fetch';

import type { paths } from './gen/v1';
import { withElevenLabs } from './with-elevenlabs';

export function createElvenLabsClient(
	config: TElevenLabsClientConfig
): TFetchClient<['base', 'openapi', 'elevenlabs'], paths> {
	const { prefixUrl = 'https://api.elevenlabs.io', apiKey } = config;
	return withElevenLabs(
		createOpenApiFetchClient<paths>({
			prefixUrl,
			beforeRequestMiddlewares: [
				(data) => {
					data.requestInit.headers['xi-api-key'] = [apiKey];
				}
			]
		})
	);
}

export interface TElevenLabsClientConfig {
	prefixUrl?: string;
	apiKey: string;
}
