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
	/** @internal Stores form-level validation separately so `getErrors().form` can stay distinct. */
	_validationStatus: TValidationStatusValue;
	/** @internal */
	_callbacks: TFormCallbacks<GFormData>;
	status: TFormStatus;
	isValidating: TState<boolean, []>;
	isSubmitted: TState<boolean, []>;
	isSubmitting: TState<boolean, []>;
	fields: TFormFields<GFormData>;
	/** @internal */
	_revalidate(options?: TFormRevalidateOptions): Promise<boolean>;
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

export interface TFormRevalidateOptions {
	/** When true (default), reruns validators before aggregating status. When false, aggregates from current field statuses only. */
	runValidators?: boolean;
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
	event?: unknown;
}

export interface TFormValidation<GFormData extends TFormData> {
	validator: TFormValidator<GFormData>;
	config: TFormValidationConfig;
}

export interface TFormValidationConfig {
	/** Validation triggers used before the first submit. */
	validateOn: readonly TFormValidateTrigger[];
	/** Validation triggers used after the first submit. */
	revalidateOn: readonly TFormRevalidateTrigger[];
	collectErrorMode: TCollectErrorMode;
}

export type TFormValidateTrigger = TFormFieldValidateTrigger;

export type TFormRevalidateTrigger = TFormFieldRevalidateTrigger;

/** Validates the full form data for cross-field and form-level constraints. */
export type TFormValidator<GFormData extends TFormData> = StandardSchemaV1<GFormData>;

export interface TFormErrors<GFormData extends TFormData> {
	fields: TFormFieldErrors<GFormData>;
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
		/** @internal */
		_callbacks: TFormFieldCallbacks;
		key: string;
		defaultValue: GValue;
		isTouched: TState<boolean, []>;
		isSubmitted: TState<boolean, []>;
		isValidating: TState<boolean, []>;
		status: TFormFieldStatus;
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
	validateOn: readonly TFormFieldValidateTrigger[];
	/** Validation triggers used after the field is submitted. */
	revalidateOn: readonly TFormFieldRevalidateTrigger[];
	collectErrorMode: TCollectErrorMode;
}

export type TFormFieldValidateTrigger = 'blur' | 'change' | 'submit' | 'touched';

export type TFormFieldRevalidateTrigger = Exclude<TFormFieldValidateTrigger, 'touched'>;

export type TCollectErrorMode = 'firstError' | 'all';

export type TFormFieldValidator<GValue> = StandardSchemaV1<GValue>;

export interface TFormFieldCallbacks {
	blur: TFormFieldBlurCallback[];
}

export type TFormFieldBlurCallback = (context: TFormFieldBlurContext) => void;

export interface TFormFieldBlurContext {
	wasTouched: boolean;
}

// MARK: - Validation Status

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
