import type { TFeatureKeys, TLogger } from './types';

export function hasFeatures<
	GFeatureKeys extends TFeatureKeys[],
	GHasFeatureKeys extends TFeatureKeys[]
>(state: TLogger<GFeatureKeys>, features: GHasFeatureKeys): state is TLogger<GHasFeatureKeys> {
	return features.every((feature) => state._features.includes(feature));
}
