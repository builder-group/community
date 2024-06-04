import type { TFeatureKeys, TState } from './types';

export function hasFeatures<
	GValue,
	GFeatureKeys extends TFeatureKeys<GValue>[],
	GHasFeatureKeys extends TFeatureKeys<GValue>[]
>(
	state: TState<GValue, GFeatureKeys>,
	features: GHasFeatureKeys
): state is TState<GValue, GHasFeatureKeys> {
	return features.every((feature) => state._features.includes(feature));
}
