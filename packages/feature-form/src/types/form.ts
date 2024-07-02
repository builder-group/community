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
	isValid: boolean;
	isValidating: boolean;
	isSubmitted: boolean;
	isSubmitting: boolean;
	_revalidate: (cached?: boolean) => Promise<boolean>;
	submit: (options?: TSubmitOptions<GFormData>) => Promise<boolean>;
	validate: () => Promise<boolean>;
	getField: <GKey extends keyof TFormFields<GFormData>>(key: GKey) => TFormFields<GFormData>[GKey];
	getData: () => Readonly<GFormData> | null;
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
	additionalData?: TAdditionalSubmitCallbackData;
	assignToInitial?: boolean;
}

export type TValidSubmitCallback<GFormData extends TFormData> = (
	formData: Readonly<GFormData>,
	additionalData?: TAdditionalSubmitCallbackData
) => Promise<void> | void;

export type TInvalidSubmitCallback<GFormData extends TFormData> = (
	errors: TInvalidFormFieldErrors<GFormData>,
	additionalData?: TAdditionalSubmitCallbackData
) => Promise<void> | void;

export interface TAdditionalSubmitCallbackData {
	[key: string]: unknown;
	event?: unknown;
}

export type TInvalidFormFieldErrors<GFormData extends TFormData> = {
	[Key in keyof GFormData]?: Readonly<TInvalidFormFieldError[]>;
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

export type TCollectErrorMode = 'firstError' | 'all';
