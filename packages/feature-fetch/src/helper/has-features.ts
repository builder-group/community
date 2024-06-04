import type { TFeatureKeys, TFetchClient } from '../types';

export function hasFeatures<
	GFeatureKeys extends TFeatureKeys[],
	GHasFeatureKeys extends TFeatureKeys[]
>(
	fetchClient: TFetchClient<GFeatureKeys>,
	features: GHasFeatureKeys
): fetchClient is TFetchClient<GHasFeatureKeys> {
	return features.every((feature) => fetchClient._features.includes(feature));
}
