import { TFeatureDefinition, TLooseFeatureNames } from '@blgc/types/features';
import { TForm, TFormData } from './types';

export function isFormWithFeatures<
	GFormData extends TFormData,
	GFeatures extends TFeatureDefinition[] = []
>(value: unknown, features: TLooseFeatureNames<GFeatures>[]): value is TForm<GFormData, GFeatures> {
	return (
		typeof value === 'object' &&
		value != null &&
		'_features' in value &&
		Array.isArray(value._features) &&
		features.every((feature) => (value._features as string[]).includes(feature))
	);
}
