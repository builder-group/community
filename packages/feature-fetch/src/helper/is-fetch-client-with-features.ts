import { TFeatureDefinition, TLooseFeatureNames } from '@blgc/types/features';
import { TFetchClient } from '../types';

export function isFetchClientWithFeatures<GFeatures extends TFeatureDefinition[] = []>(
	value: unknown,
	features: TLooseFeatureNames<GFeatures>[]
): value is TFetchClient<GFeatures> {
	return (
		typeof value === 'object' &&
		value != null &&
		'_features' in value &&
		Array.isArray(value._features) &&
		features.every((feature) => (value._features as string[]).includes(feature))
	);
}
