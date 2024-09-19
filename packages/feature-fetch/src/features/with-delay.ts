import { sleep } from '@blgc/utils';

import type {
	TEnforceFeatures,
	TFeatureKeys,
	TFetchClient,
	TFetchLike,
	TRequestMiddleware
} from '../types';

export function withDelay<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	delayInMs: number
): TFetchClient<['delay', ...GSelectedFeatureKeys]> {
	fetchClient._features.push('delay');
	fetchClient._config.requestMiddlewares.push(createDelayMiddleware(delayInMs));
	return fetchClient as TFetchClient<['delay', ...GSelectedFeatureKeys]>;
}

export function createDelayMiddleware(delayInMs: number): TRequestMiddleware {
	return (next: TFetchLike) =>
		async (url, requestInit): Promise<Response> => {
			await sleep(delayInMs);
			return next(url, requestInit);
		};
}
