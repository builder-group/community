import type { TFeatureKeys, TForm, TFormData } from './types';

export function hasFeatures<
	GFormData extends TFormData,
	GFeatureKeys extends TFeatureKeys[],
	GHasFeatureKeys extends TFeatureKeys[]
>(
	form: TForm<GFormData, GFeatureKeys>,
	features: GHasFeatureKeys
): form is TForm<GFormData, (GFeatureKeys[number] | GHasFeatureKeys[number])[]> {
	return features.every((feature) => form._features.includes(feature));
}
