import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { sleep } from '@blgc/utils';
import type { TDelayFeature, TFetchClient, TFetchLike, TRequestMiddleware } from '../types';

export function withDelay<GFeatures extends TFeatureDefinition[]>(
	baseFetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>,
	delayInMs: number
): TFetchClient<[TDelayFeature, ...GFeatures]> {
	(baseFetchClient as TFetchClient<[TDelayFeature]>)._features.push('delay');

	baseFetchClient._config.requestMiddlewares.push(createDelayMiddleware(delayInMs));

	return baseFetchClient as TFetchClient<[TDelayFeature, ...GFeatures]>;
}

export function createDelayMiddleware(delayInMs: number): TRequestMiddleware {
	return (next: TFetchLike) =>
		async (url, requestInit): Promise<Response> => {
			await sleep(delayInMs);
			return next(url, requestInit);
		};
}
