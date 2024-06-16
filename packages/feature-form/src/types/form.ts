import { TFeatureKeys, TSelectFeatures } from './features';
import { TFormField } from './form-field';

export type TForm<GFormData extends TFormData, GSelectedFeatureKeys extends TFeatureKeys[]> = {
	_features: string[];
	_data: TFormState<GFormData>;
	isValid: boolean;
	isModified: boolean;
	submitted: boolean;
} & TSelectFeatures<GFormData, GSelectedFeatureKeys>;

export type TFormState<GFormData extends Record<string, unknown>> = {
	[Key in keyof GFormData]: TFormField<GFormData[Key]>;
};

export type TFormData = Record<string, unknown>;
