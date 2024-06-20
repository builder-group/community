import type { TFeatureKeys, TLogger } from './types';

export function hasFeatures<
	GFeatureKeys extends TFeatureKeys[],
	GHasFeatureKeys extends TFeatureKeys[]
>(
	logger: TLogger<GFeatureKeys>,
	features: GHasFeatureKeys
): logger is TLogger<(GFeatureKeys[number] | GHasFeatureKeys[number])[]> {
	return features.every((feature) => logger._features.includes(feature));
}
