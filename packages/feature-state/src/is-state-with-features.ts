import { TFeatureDefinition, TLooseFeatureNames } from '@blgc/types/features';
import { TState } from './types';

export function isStateWithFeatures<GValue = unknown, GFeatures extends TFeatureDefinition[] = []>(
	value: unknown,
	features: TLooseFeatureNames<GFeatures>[]
): value is TState<GValue, GFeatures> {
	return (
		typeof value === 'object' &&
		value != null &&
		'_features' in value &&
		Array.isArray(value._features) &&
		features.every((feature) => (value._features as string[]).includes(feature))
	);
}
