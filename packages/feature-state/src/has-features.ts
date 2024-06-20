import type { TFeatureKeys, TState } from './types';

export function hasFeatures<
	GValue,
	GFeatureKeys extends TFeatureKeys<GValue>[],
	GHasFeatureKeys extends TFeatureKeys<GValue>[]
>(
	state: TState<GValue, GFeatureKeys>,
	features: GHasFeatureKeys
): state is TState<GValue, (GFeatureKeys[number] | GHasFeatureKeys[number])[]> {
	return features.every((feature) => state._features.includes(feature as GFeatureKeys[number]));
}
