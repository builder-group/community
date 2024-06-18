import { type TState } from 'feature-state';

import { type TFormField, type TFormFieldValidator } from './form-field';

export type TForm<GFormData extends TFormData> = TState<TFormFields<GFormData>, ['base', 'form']>;

export interface TFormStateFeature<GFormFields> {
	_config: TFormConfig<TExtractGFormDataTFormFields<GFormFields>>;
	key: string;
	isValid: boolean;
	isModified: boolean;
	submitted: boolean;
	getField: <GKey extends keyof GFormFields>(key: GKey) => GFormFields[GKey];
	submit: () => void;
	reset: () => void;
}

export type TFormFields<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TFormField<GFormData[Key]>;
};

export type TExtractGFormDataTFormFields<T> = T extends TFormFields<infer G> ? G : never;

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

export type TFormReValidateMode = 'onBlur' | 'onChange' | 'onSubmit' | 'afterFirstSubmit';

export type TCollectErrorMode = 'firstError' | 'all';
