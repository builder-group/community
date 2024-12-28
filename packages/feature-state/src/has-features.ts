import { TFeatureDefinition, TLooseFeatureNames } from '@blgc/types/features';
import { TState } from './types';

export function hasFeatures<GValue = unknown, GFeatures extends TFeatureDefinition[] = []>(
	state: unknown,
	features: TLooseFeatureNames<GFeatures>[]
): state is TState<GValue, GFeatures> {
	return (
		typeof state === 'object' &&
		state != null &&
		'_features' in state &&
		Array.isArray(state._features) &&
		features.every((feature) => (state._features as string[]).includes(feature))
	);
}
