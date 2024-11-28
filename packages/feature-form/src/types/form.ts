import { type TState } from 'feature-state';
import { type TCollectErrorMode } from 'validation-adapter';
import { type TFeatureKeys, type TSelectFeatures } from './features';
import {
	type TFormField,
	type TFormFieldValidator,
	type TInvalidFormFieldError
} from './form-field';

// Note: TForm is not itself a state because of type issues mainly because GFormData is the main generic,
// but the State value was TFormFields<GFormData>. Thus We had to check if GValue extends TFormFields<infer GFormData>,
// which was unreliable in TypeScript if deeply nested.
export type TForm<GFormData extends TFormData, GSelectedFeatureKeys extends TFeatureKeys[]> = {
	_features: string[];
	_config: TFormConfig;
	_validSubmitCallbacks: TValidSubmitCallback<GFormData>[];
	_invalidSubmitCallbacks: TInvalidSubmitCallback<GFormData>[];
	fields: TFormFields<GFormData>;
	isValid: TState<boolean, ['base']>;
	isValidating: TState<boolean, ['base']>;
	isSubmitted: TState<boolean, ['base']>;
	isSubmitting: TState<boolean, ['base']>;
	_revalidate: (cached?: boolean) => Promise<boolean>;
	submit: (options?: TSubmitOptions<GFormData>) => Promise<boolean>;
	validate: () => Promise<boolean>;
	getField: <GKey extends keyof TFormFields<GFormData>>(key: GKey) => TFormFields<GFormData>[GKey];
	getValidData: () => Readonly<GFormData> | null;
	getErrors: () => TInvalidFormFieldErrors<GFormData>;
	reset: () => void;
} & TSelectFeatures<GFormData, GSelectedFeatureKeys>;

export type TFormFields<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TFormField<GFormData[Key]>;
};

export type TFormValidators<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TFormFieldValidator<GFormData[Key]>;
};

export type TFormData = Record<string, any>;

export interface TSubmitOptions<GFormData extends TFormData> {
	onValidSubmit?: TValidSubmitCallback<GFormData>;
	onInvalidSubmit?: TInvalidSubmitCallback<GFormData>;
	postSubmitCallback?: TPostSubmitCallback<GFormData>;
	additionalData?: TAdditionalSubmitCallbackData;
	assignToInitial?: boolean;
}

export type TValidSubmitCallback<GFormData extends TFormData> = (
	formData: Readonly<GFormData>,
	additionalData?: TAdditionalSubmitCallbackData
) => TSubmitCallbackResponse;

export type TInvalidSubmitCallback<GFormData extends TFormData> = (
	errors: TInvalidFormFieldErrors<GFormData>,
	additionalData?: TAdditionalSubmitCallbackData
) => TSubmitCallbackResponse;

export type TSubmitCallbackResponse = Promise<void | TSubmitData> | void | TSubmitData;

export type TSubmitData = Record<string, unknown>;

export type TPostSubmitCallback<GFormData extends TFormData> = (
	form: TForm<GFormData, ['base']>,
	submitData: TSubmitData
) => void;

export interface TAdditionalSubmitCallbackData {
	[key: string]: unknown;
	event?: unknown;
}

export type TInvalidFormFieldErrors<GFormData extends TFormData> = {
	[Key in keyof GFormData]?: readonly TInvalidFormFieldError[];
};

export interface TFormConfig {
	/**
	 * Indicates if the form is disabled.
	 */
	disabled: boolean;
	/**
	 * Error collection mode. 'firstError' gathers only the first error per field, 'all' gathers all errors.
	 */
	collectErrorMode: TCollectErrorMode;
}
