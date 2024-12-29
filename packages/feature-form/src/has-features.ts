import { TFeatureDefinition, TLooseFeatureNames } from '@blgc/types/features';
import { TForm, TFormData } from './types';

export function hasFeatures<
	GFormData extends TFormData,
	GFeatures extends TFeatureDefinition[] = []
>(form: unknown, features: TLooseFeatureNames<GFeatures>[]): form is TForm<GFormData, GFeatures> {
	return (
		typeof form === 'object' &&
		form != null &&
		'_features' in form &&
		Array.isArray(form._features) &&
		features.every((feature) => (form._features as string[]).includes(feature))
	);
}
