import { type TState } from 'feature-state';

import { type TFeatureKeys, type TSelectFeatures } from './features';
import { type TFormField, type TFormFieldValidator } from './form-field';

export type TForm<GFormData extends TFormData, GSelectedFeatureKeys extends TFeatureKeys[]> = {
	_features: string[];
	_config: TFormConfig<GFormData>;
	key: string;
	// Note: TForm is not a state because of type issues mainly because GFormData is the main generic,
	// but the State value was TFormFields<GFormData>. Thus We had to check if GValue extends TFormFields<infer GFormData>,
	// which was unreliable in TypeScript if deeply nested.
	fields: TState<TFormFields<GFormData>, ['base']>;
	isValid: boolean;
	isModified: boolean;
	isSubmitted: boolean;
	getField: <GKey extends keyof TFormFields<GFormData>>(key: GKey) => TFormFields<GFormData>[GKey];
	submit: () => void;
	reset: () => void;
} & TSelectFeatures<GFormData, GSelectedFeatureKeys>;

export type TFormFields<GFormData extends TFormData> = {
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
	onSubmit: ((data: GFormData) => void) | null;
}

export type TFormValidateMode = 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';

export type TFormReValidateMode = 'onBlur' | 'onChange' | 'onSubmit' | 'afterFirstSubmit';

export type TCollectErrorMode = 'firstError' | 'all';
