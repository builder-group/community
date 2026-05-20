import type { StandardSchemaV1 } from '@standard-schema/spec';
import { type TAnyFeature, type TFeature, type TFeatureHost } from 'feature-core';
import { type TState } from 'feature-state';

export type TForm<GFormData extends TFormData, GFeatures extends TAnyFeature[] = []> = TFeatureHost<
	TFormBase<GFormData>,
	GFeatures
>;

/**
 * Core form API available on every form.
 * Reactive values are states; callbacks and config are plain properties.
 */
export interface TFormBase<GFormData extends TFormData> {
	/** @internal */
	_validation?: TFormValidation<GFormData>;
	/** @internal Increments to prevent stale async validation runs from committing after reset or newer validation. */
	_validationRunId: number;
	/** @internal Stores form-level validator status after field-path errors have been routed to fields. */
	_formValidatorStatus: TValidationStatusValue;
	/** @internal */
	_callbacks: TFormCallbacks<GFormData>;
	status: TFormStatus;
	isValidating: TState<boolean, []>;
	isSubmitted: TState<boolean, []>;
	isSubmitting: TState<boolean, []>;
	fields: TFormFields<GFormData>;
	/** Registers a callback for every valid submit. Returns an unsubscribe function. */
	onValidSubmit(callback: TFormValidSubmitCallback<GFormData>): () => void;
	/** Registers a callback for every invalid submit. Returns an unsubscribe function. */
	onInvalidSubmit(callback: TFormInvalidSubmitCallback<GFormData>): () => void;
	/** Validates the form, fires submit callbacks, and returns true if the form was valid. */
	submit(options?: TFormSubmitOptions<GFormData>): Promise<boolean>;
	/** Runs all validators and returns true if valid, false otherwise. */
	validate(): Promise<boolean>;
	reset(): void;
	getField<GKey extends TFormFieldKey<GFormData>>(key: GKey): TFormFields<GFormData>[GKey];
	/** Returns current field values without checking validity. */
	getData(): Readonly<GFormData>;
	/** Returns current field values when the form is valid, otherwise `null`. */
	getValidData(): Readonly<GFormData> | null;
	/** Returns current field and form-level validation errors. */
	getErrors(): TFormErrors<GFormData>;
}

export type TFormData = object;

export type TFormFieldKey<GFormData extends TFormData> = Extract<keyof GFormData, string>;

export type TFormFields<GFormData extends TFormData> = {
	[Key in TFormFieldKey<GFormData>]: TFormField<GFormData[Key]>;
};

/** Aggregate validation status for the whole form, including field and form-level errors. */
export type TFormStatus = TValidationStatus;

export interface TFormCallbacks<GFormData extends TFormData> {
	validSubmit: TFormValidSubmitCallback<GFormData>[];
	invalidSubmit: TFormInvalidSubmitCallback<GFormData>[];
}

export interface TFormSubmitOptions<GFormData extends TFormData> {
	onValidSubmit?: TFormValidSubmitCallback<GFormData>;
	onInvalidSubmit?: TFormInvalidSubmitCallback<GFormData>;
	context?: TFormSubmitContext;
	/** Updates field default values after a successful submit so future resets return to submitted data. */
	updateDefaultValues?: boolean;
}

export type TFormValidSubmitCallback<GFormData extends TFormData> = (
	formData: Readonly<GFormData>,
	context?: TFormSubmitContext
) => Promise<void> | void;

export type TFormInvalidSubmitCallback<GFormData extends TFormData> = (
	errors: TFormErrors<GFormData>,
	context?: TFormSubmitContext
) => Promise<void> | void;

export interface TFormSubmitContext {
	[key: string]: unknown;
	/** The HTML submit event, if the form was submitted via a DOM form element. */
	event?: unknown;
}

export interface TFormValidation<GFormData extends TFormData> {
	validator: TFormValidator<GFormData>;
	config: TFormValidationConfig;
}

export interface TFormValidationConfig {
	/** Validation triggers used before the first submit. */
	validateOn: readonly TValidateTrigger[];
	/** Validation triggers used after the first submit. */
	revalidateOn: readonly TRevalidateTrigger[];
	collectErrorMode: TCollectErrorMode;
}

/** Validates the full form data for cross-field and form-level constraints. */
export type TFormValidator<GFormData extends TFormData> = StandardSchemaV1<GFormData, unknown>;

export interface TFormErrors<GFormData extends TFormData> {
	/** Field-level errors keyed by field, including form-level validator errors routed by field path. */
	fields: TFormFieldErrors<GFormData>;
	/** Pathless form-level validator errors, plus errors whose path does not match a field. */
	form: readonly TFormError[];
}

export type TFormError = TValidationError;

export type TFormFieldErrors<GFormData extends TFormData> = {
	[Key in TFormFieldKey<GFormData>]?: readonly TFormFieldError[];
};

export type TFormFieldError = TValidationError;

// MARK: - Form Field

export type TFormField<GValue> = TState<GValue, [TFormFieldFeature<GValue>]>;

export type TFormFieldFeature<GValue> = TFeature<
	'form-field',
	{
		/** @internal */
		_validation?: TFormFieldValidation<GValue>;
		/** @internal Increments to prevent stale async validation runs from committing after reset or newer validation. */
		_validationRunId: number;
		/** @internal Stores the field validator result before routed form-level errors are merged into `status`. */
		_fieldValidatorStatus: TValidationStatusValue;
		/** @internal Form-level validator errors routed to this field by path. */
		_formValidatorErrors: readonly TValidationError[];
		/** @internal */
		_callbacks: TFormFieldCallbacks;
		key: string;
		defaultValue: GValue;
		isTouched: TState<boolean, []>;
		/** True after the standalone field or parent form has been submitted. */
		isSubmitted: TState<boolean, []>;
		isValidating: TState<boolean, []>;
		/** Field display status, including this field's validator errors and routed form-level errors. */
		status: TFormFieldStatus;
		/** @internal Updates routed form-level errors and syncs the public field status. */
		_applyFormValidatorErrors: (errors: readonly TValidationError[]) => void;
		/** Runs the field validator and updates `status`. */
		validate: () => Promise<boolean>;
		/** Registers a callback for future blur events. Returns an unsubscribe function. */
		onBlur: (callback: TFormFieldBlurCallback) => () => void;
		/** Marks the field as touched and runs blur validation when configured. */
		blur: () => void;
		reset: () => void;
	}
>;

export type TFormFieldStatus = TValidationStatus;

export interface TFormFieldValidation<GValue> {
	validator: TFormFieldValidator<GValue>;
	config: TFormFieldValidationConfig;
}

export interface TFormFieldValidationConfig {
	/** Validation triggers used before the field is submitted. */
	validateOn: readonly TValidateTrigger[];
	/** Validation triggers used after the field is submitted. */
	revalidateOn: readonly TRevalidateTrigger[];
	collectErrorMode: TCollectErrorMode;
}

export type TFormFieldValidator<GValue> = StandardSchemaV1<GValue, unknown>;

export interface TFormFieldCallbacks {
	blur: TFormFieldBlurCallback[];
}

export type TFormFieldBlurCallback = (context: TFormFieldBlurContext) => void;

export interface TFormFieldBlurContext {
	wasTouched: boolean;
}

// MARK: - Validation

export type TCollectErrorMode = 'firstError' | 'all';

export type TValidateTrigger = 'blur' | 'change' | 'submit' | 'touched';

export type TRevalidateTrigger = Exclude<TValidateTrigger, 'touched'>;

/** Validation status state used by forms and fields. */
export type TValidationStatus = TState<TValidationStatusValue, []>;

export type TValidationStatusValue =
	| TInvalidValidationStatus
	| TValidValidationStatus
	| TUnvalidatedValidationStatus;

export interface TInvalidValidationStatus {
	type: 'invalid';
	errors: readonly TValidationError[];
}

export interface TValidationError {
	message: string;
	/** Standard Schema-compatible path associated with the error. */
	path?: TValidationPath;
}

/** Standard Schema-compatible validation path segments. */
export type TValidationPath = readonly PropertyKey[];

export interface TValidValidationStatus {
	type: 'valid';
}

export interface TUnvalidatedValidationStatus {
	type: 'unvalidated';
}
