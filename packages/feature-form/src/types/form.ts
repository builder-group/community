import { TFeatureKeys, TSelectFeatures } from './features';
import { TFormField, TFormFieldValidator } from './form-field';

export type TForm<GFormData extends TFormData, GSelectedFeatureKeys extends TFeatureKeys[]> = {
	_features: string[];
	_config: TFormConfig<GFormData>;
	_data: TFormState<GFormData>;
	key: string;
	isValid: boolean;
	isModified: boolean;
	submitted: boolean;
} & TSelectFeatures<GFormData, GSelectedFeatureKeys>;

export type TFormState<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TFormField<GFormData[Key]>;
};

export type TFormValidators<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TFormFieldValidator<GFormData[Key]>;
};

export type TFormData = Record<string, unknown>;

export interface TFormConfig<GFormData extends TFormData> {
	/**
	 * Validation strategy after submitting.
	 */
	mode: TFormValidateMode;
	/**
	 * Validation strategy before submitting.
	 */
	reValidateMode: TFormReValidateMode;
	/**
	 * Indicates if the form is disabled.
	 */
	disabled: boolean;
	/**
	 * Error collection mode. 'firstError' gathers only the first error per field, 'all' gathers all errors.
	 */
	collectErrorMode: TCollectErrorMode;
	/**
	 * Called once form is submitted
	 */
	onSubmit: ((data: GFormData) => Promise<void>) | null;
}

export type TFormValidateMode = 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';

export type TFormReValidateMode = 'onBlur' | 'onChange' | 'onSubmit';

export type TCollectErrorMode = 'firstError' | 'all';
