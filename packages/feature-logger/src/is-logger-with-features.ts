import { TFeatureDefinition, TLooseFeatureNames } from '@blgc/types/features';
import { TLogger } from './types';

export function isLoggerWithFeatures<GFeatures extends TFeatureDefinition[] = []>(
	value: unknown,
	features: TLooseFeatureNames<GFeatures>[]
): value is TLogger<GFeatures> {
	return (
		typeof value === 'object' &&
		value != null &&
		'_features' in value &&
		Array.isArray(value._features) &&
		features.every((feature) => (value._features as string[]).includes(feature))
	);
}
