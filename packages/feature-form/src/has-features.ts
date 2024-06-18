import type { TFeatureKeys, TForm, TFormData } from './types';

export function hasFeatures<
	GFormData extends TFormData,
	GFeatureKeys extends TFeatureKeys[],
	GHasFeatureKeys extends TFeatureKeys[]
>(
	state: TForm<GFormData, GFeatureKeys>,
	features: GHasFeatureKeys
): state is TForm<GFormData, GHasFeatureKeys> {
	return features.every((feature) => state._features.includes(feature));
}
