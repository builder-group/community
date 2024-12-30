import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { sleep } from '@blgc/utils';
import type { TDelayFeature, TFetchClient, TFetchLike, TRequestMiddleware } from '../types';

export function withDelay<GFeatures extends TFeatureDefinition[]>(
	fetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>,
	delayInMs: number
): TFetchClient<[TDelayFeature, ...GFeatures]> {
	(fetchClient as TFetchClient<[TDelayFeature]>)._features.push('delay');
	fetchClient._config.requestMiddlewares.push(createDelayMiddleware(delayInMs));
	return fetchClient as TFetchClient<[TDelayFeature, ...GFeatures]>;
}

export function createDelayMiddleware(delayInMs: number): TRequestMiddleware {
	return (next: TFetchLike) =>
		async (url, requestInit): Promise<Response> => {
			await sleep(delayInMs);
			return next(url, requestInit);
		};
}
