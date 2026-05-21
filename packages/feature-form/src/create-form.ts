import { createFeatureHost } from 'feature-core';
import { createState, isEqualFeature } from 'feature-state';
import { createFormField, formFieldResetSourceKey, isFormField } from './form-field';
import { deepCopy } from './lib';
import { validateStandardSchema } from './standard-schema';
import {
	type TForm,
	type TFormBase,
	type TFormData,
	type TFormField,
	type TFormFieldErrors,
	type TFormFieldKey,
	type TFormFields,
	type TFormFieldValidationConfig,
	type TFormFieldValidator,
	type TFormInvalidSubmitCallback,
	type TFormStatus,
	type TFormSubmitContext,
	type TFormValidationConfig,
	type TFormValidator,
	type TFormValidSubmitCallback,
	type TValidationError,
	type TValidationStatusValue
} from './types';
import { areValidationStatusesEqual } from './validation-status';

/** Creates a form from field configs or existing form fields. */
export function createForm<GFields extends TCreateFormFieldsInput>(
	config: TCreateFormConfig<TCreateFormDataFromFields<GFields>> & { fields: GFields }
): TForm<TCreateFormDataFromFields<GFields>, []>;
/** Creates a form from field configs or existing form fields. */
export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData, []>;
export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData, []> {
	const {
		fields,
		validator,
		validateOn = ['submit'] as const,
		revalidateOn = ['submit', 'change'] as const,
		collectErrorMode = 'firstError',
		onInvalidSubmit,
		onValidSubmit
	} = config;
	// Note: No validator means there is no pending validation work
	const initialFormValidatorStatus: TValidationStatusValue =
		validator == null ? { type: 'valid' } : { type: 'unvalidated' };

	const form = createFeatureHost<TFormBase<GFormData>>({
		_validation:
			validator == null
				? undefined
				: {
						validator,
						config: {
							validateOn,
							revalidateOn,
							collectErrorMode
						}
					},
		_validationRunId: 0,
		_formValidatorStatus: initialFormValidatorStatus,
		_callbacks: {
			invalidSubmit: onInvalidSubmit == null ? [] : [onInvalidSubmit],
			validSubmit: onValidSubmit == null ? [] : [onValidSubmit]
		},
		status: createState<TValidationStatusValue>(initialFormValidatorStatus).with(
			isEqualFeature(areValidationStatusesEqual)
		),
		isValidating: createState(false),
		isSubmitted: createState(false),
		isSubmitting: createState(false),
		fields: Object.fromEntries(
			(
				Object.entries(fields) as Array<
					[
						TFormFieldKey<GFormData>,
						TCreateFormConfigFormField<GFormData[TFormFieldKey<GFormData>]> | TFormField<unknown>
					]
				>
			).map(([fieldKey, field]) => [
				fieldKey,
				isFormField(field)
					? field
					: createFormField(field.defaultValue, {
							key: fieldKey,
							validator: field.validator,
							collectErrorMode: field.collectErrorMode ?? collectErrorMode,
							revalidateOn: field.revalidateOn ?? revalidateOn,
							validateOn: field.validateOn ?? validateOn
						})
			])
		) as TFormFields<GFormData>,
		onValidSubmit(this: TForm<GFormData, []>, callback) {
			this._callbacks.validSubmit.push(callback);

			return () => {
				const index = this._callbacks.validSubmit.indexOf(callback);
				if (index !== -1) {
					this._callbacks.validSubmit.splice(index, 1);
				}
			};
		},
		onInvalidSubmit(this: TForm<GFormData, []>, callback) {
			this._callbacks.invalidSubmit.push(callback);

			return () => {
				const index = this._callbacks.invalidSubmit.indexOf(callback);
				if (index !== -1) {
					this._callbacks.invalidSubmit.splice(index, 1);
				}
			};
		},
		async submit(this: TForm<GFormData, []>, options = {}) {
			this.isSubmitting.set(true);
			try {
				await revalidateForm(this, {
					shouldValidateField: (formField) =>
						formField._validation != null &&
						(formField.isSubmitted.get()
							? formField._validation.config.revalidateOn.includes('submit')
							: formField._validation.config.validateOn.includes('submit')),
					shouldValidateForm:
						this._validation != null &&
						(this.isSubmitted.get()
							? this._validation.config.revalidateOn.includes('submit')
							: this._validation.config.validateOn.includes('submit'))
				});

				for (const formField of getFormFields(this.fields)) {
					formField.isSubmitted.set(true);
				}
				this.isSubmitted.set(true);

				const data = this.getValidData();
				if (data != null) {
					if (options.updateDefaultValues) {
						for (const [fieldKey, formField] of getFormFieldEntries(this.fields)) {
							formField.defaultValue = deepCopy(data[fieldKey]);
						}
					}

					await runSubmitCallbacks(
						options.onValidSubmit != null
							? [...this._callbacks.validSubmit, options.onValidSubmit]
							: this._callbacks.validSubmit,
						data,
						options.context
					);
					return true;
				}

				const errors = this.getErrors();
				await runSubmitCallbacks(
					options.onInvalidSubmit != null
						? [...this._callbacks.invalidSubmit, options.onInvalidSubmit]
						: this._callbacks.invalidSubmit,
					errors,
					options.context
				);
				return false;
			} finally {
				this.isSubmitting.set(false);
			}
		},
		async validate(this: TForm<GFormData, []>) {
			return revalidateForm(this, {
				shouldValidateField: (formField) => formField._validation != null,
				shouldValidateForm: this._validation != null
			});
		},
		// Note: reset clears flags and invalidates validation runs, but does not cancel submit callbacks already in progress
		reset(this: TForm<GFormData, []>) {
			for (const formField of getFormFields(this.fields)) {
				formField.reset();
			}
			this._validationRunId++;
			applyFormValidatorStatus(
				this,
				this._validation == null ? { type: 'valid' } : { type: 'unvalidated' }
			);
			this.status.set(getFormStatus(this));
			this.isValidating.set(false);
			this.isSubmitted.set(false);
			this.isSubmitting.set(false);
		},
		getField(this: TForm<GFormData, []>, fieldKey) {
			return this.fields[fieldKey];
		},
		getData(this: TForm<GFormData, []>) {
			return Object.fromEntries(
				getFormFieldEntries(this.fields).map(([fieldKey, formField]) => [fieldKey, formField.get()])
			) as GFormData;
		},
		getValidData(this: TForm<GFormData, []>) {
			if (this.status.get().type !== 'valid') {
				return null;
			}

			return this.getData();
		},
		getErrors(this: TForm<GFormData, []>) {
			return {
				fields: getFormFieldErrors(this.fields),
				form: this._formValidatorStatus.type === 'invalid' ? this._formValidatorStatus.errors : []
			};
		}
	});

	// Sync once after fields exist because the form validator status does not include field statuses
	applyFormValidatorStatus(form, form._formValidatorStatus);
	form.status.set(getFormStatus(form));

	registerFormListeners(form);

	return form;
}

export interface TCreateFormConfig<GFormData extends TFormData> {
	/** Field configs or pre-built form fields keyed by form data property. */
	fields: TCreateFormConfigFormFields<GFormData>;
	/** Optional form-level validator for cross-field constraints. */
	validator?: TFormValidator<NoInfer<GFormData>>;
	/** Default validation triggers for the form validator and fields that do not override them. */
	validateOn?: TFormValidationConfig['validateOn'];
	/** Default revalidation triggers for the form validator and fields that do not override them. */
	revalidateOn?: TFormValidationConfig['revalidateOn'];
	/** Default error collection mode for the form validator and fields that do not override it. */
	collectErrorMode?: TFormValidationConfig['collectErrorMode'];
	/** Called on every valid submit. Per-call overrides can be passed directly to `submit()`. */
	onValidSubmit?: TFormValidSubmitCallback<GFormData>;
	/** Called on every invalid submit. Per-call overrides can be passed directly to `submit()`. */
	onInvalidSubmit?: TFormInvalidSubmitCallback<GFormData>;
}

/** Maps each form data property to a form field config or an existing form field. */
export type TCreateFormConfigFormFields<GFormData extends TFormData> = {
	[Key in TFormFieldKey<GFormData>]:
		| TCreateFormConfigFormField<GFormData[Key]>
		| TFormField<GFormData[Key]>;
};

export type TCreateFormDataFromFields<GFields extends TCreateFormFieldsInput> = {
	[Key in Extract<keyof GFields, string>]: GFields[Key] extends TFormField<infer GValue>
		? GValue
		: GFields[Key] extends { defaultValue: infer GValue }
			? GValue
			: never;
};

export type TCreateFormFieldsInput = Record<
	string,
	TCreateFormConfigFormField<unknown> | TFormField<unknown>
>;

/** Configures one form field when `createForm()` should create the field. */
export interface TCreateFormConfigFormField<GValue> {
	defaultValue: GValue;
	validator?: TFormFieldValidator<NoInfer<GValue>>;
	collectErrorMode?: TFormFieldValidationConfig['collectErrorMode'];
	revalidateOn?: TFormFieldValidationConfig['revalidateOn'];
	validateOn?: TFormFieldValidationConfig['validateOn'];
}

function registerFormListeners<GFormData extends TFormData>(form: TForm<GFormData, []>): void {
	for (const formField of getFormFields(form.fields)) {
		formField.status.listen(() => {
			form.status.set(getFormStatus(form));
		});

		formField.onBlur(({ wasTouched }) => {
			// Note: 'touched' validates the form on the first field blur; 'blur' validates on every field blur
			const shouldValidateFormOnBlur =
				form._validation != null &&
				(form.isSubmitted.get()
					? form._validation.config.revalidateOn.includes('blur')
					: form._validation.config.validateOn.includes('blur') ||
						(!wasTouched && form._validation.config.validateOn.includes('touched')));
			if (!shouldValidateFormOnBlur) {
				return;
			}

			void revalidateForm(form, {
				shouldValidateField: () => false,
				shouldValidateForm: true
			});
		});

		formField.listen(({ source }) => {
			if (source === formFieldResetSourceKey) {
				return;
			}

			const shouldValidateFormOnFieldChange =
				form._validation != null &&
				(form.isSubmitted.get()
					? form._validation.config.revalidateOn.includes('change')
					: form._validation.config.validateOn.includes('change') ||
						(form._validation.config.validateOn.includes('touched') && formField.isTouched.get()));
			if (!shouldValidateFormOnFieldChange) {
				return;
			}

			void revalidateForm(form, {
				shouldValidateField: () => false,
				shouldValidateForm: true
			});
		});
	}
}

async function revalidateForm<GFormData extends TFormData>(
	form: TForm<GFormData, []>,
	options: TRevalidateFormOptions<GFormData>
): Promise<boolean> {
	const { shouldValidateField, shouldValidateForm } = options;
	const fieldValidationPromises = getFormFields(form.fields)
		.filter(shouldValidateField)
		.map((field) => field.validate());

	const shouldSetValidating = fieldValidationPromises.length > 0 || shouldValidateForm;
	const validationRunId = shouldSetValidating ? ++form._validationRunId : null;
	if (shouldSetValidating) {
		form.isValidating.set(true);
	}

	try {
		await Promise.all([
			...fieldValidationPromises,
			...(shouldValidateForm && validationRunId != null
				? [validateFormValidator(form, validationRunId)]
				: [])
		]);
	} finally {
		if (validationRunId != null && validationRunId === form._validationRunId) {
			form.isValidating.set(false);
		}
	}

	const status = getFormStatus(form);
	form.status.set(status);
	return status.type === 'valid';
}

interface TRevalidateFormOptions<GFormData extends TFormData> {
	shouldValidateField: (field: TFormFields<GFormData>[TFormFieldKey<GFormData>]) => boolean;
	shouldValidateForm: boolean;
}

async function validateFormValidator<GFormData extends TFormData>(
	form: TForm<GFormData, []>,
	validationRunId: number
): Promise<void> {
	if (form._validation == null) {
		applyFormValidatorStatus(form, { type: 'valid' });
		return;
	}

	let status: TValidationStatusValue = { type: 'valid' };
	try {
		status = await validateStandardSchema(
			form._validation.validator,
			form.getData(),
			form._validation.config.collectErrorMode
		);
	} catch (error) {
		status = {
			type: 'invalid',
			errors: [
				{
					message: error instanceof Error ? error.message : String(error),
					path: ['form']
				}
			]
		};
	}

	if (validationRunId !== form._validationRunId) {
		return;
	}

	applyFormValidatorStatus(form, status);
}

function getFormStatus<GFormData extends TFormData>(
	form: TForm<GFormData, []>
): TFormStatus['value'] {
	const errors: TValidationError[] = [];
	let hasUnvalidatedStatus = false;

	for (const formField of getFormFields(form.fields)) {
		const status = formField.status.get();
		if (status.type === 'invalid') {
			errors.push(...status.errors);
		} else if (status.type === 'unvalidated') {
			hasUnvalidatedStatus = true;
		}
	}

	if (form._formValidatorStatus.type === 'invalid') {
		errors.push(...form._formValidatorStatus.errors);
	} else if (form._formValidatorStatus.type === 'unvalidated') {
		hasUnvalidatedStatus = true;
	}

	if (errors.length > 0) {
		return { type: 'invalid', errors };
	}

	return hasUnvalidatedStatus ? { type: 'unvalidated' } : { type: 'valid' };
}

function applyFormValidatorStatus<GFormData extends TFormData>(
	form: TForm<GFormData, []>,
	status: TValidationStatusValue
): void {
	if (status.type !== 'invalid') {
		form._formValidatorStatus = status;
		for (const formField of getFormFields(form.fields)) {
			formField._applyFormValidatorErrors([]);
		}
		return;
	}

	const fieldErrors: TFormFieldErrors<GFormData> = {};
	const formErrors: TValidationError[] = [];
	for (const error of status.errors) {
		const path = error.path;
		if (path == null) {
			formErrors.push(error);
			continue;
		}

		const fieldKey = path[0];
		if (typeof fieldKey !== 'string' || !(fieldKey in form.fields)) {
			formErrors.push(error);
			continue;
		}

		const fieldPath = path.slice(1);
		fieldErrors[fieldKey as TFormFieldKey<GFormData>] = [
			...(fieldErrors[fieldKey as TFormFieldKey<GFormData>] ?? []),
			{
				...error,
				path: fieldPath.length > 0 ? fieldPath : undefined
			}
		];
	}

	form._formValidatorStatus =
		formErrors.length > 0 ? { type: 'invalid', errors: formErrors } : { type: 'valid' };

	for (const [fieldKey, formField] of getFormFieldEntries(form.fields)) {
		formField._applyFormValidatorErrors(fieldErrors[fieldKey] ?? []);
	}
}

function getFormFieldErrors<GFormData extends TFormData>(
	fields: TFormFields<GFormData>
): TFormFieldErrors<GFormData> {
	const errors: TFormFieldErrors<GFormData> = {};

	for (const [fieldKey, formField] of getFormFieldEntries(fields)) {
		const status = formField.status.get();
		if (status.type === 'invalid') {
			errors[fieldKey] = status.errors;
		}
	}

	return errors;
}

async function runSubmitCallbacks<GValue>(
	callbacks: Array<(value: GValue, context?: TFormSubmitContext) => Promise<void> | void>,
	value: GValue,
	context: TFormSubmitContext | undefined
): Promise<void> {
	await Promise.all(callbacks.map((callback) => callback(value, context)));
}

function getFormFields<GFormData extends TFormData>(
	fields: TFormFields<GFormData>
): Array<TFormFields<GFormData>[TFormFieldKey<GFormData>]> {
	return Object.values(fields) as Array<TFormFields<GFormData>[TFormFieldKey<GFormData>]>;
}

function getFormFieldEntries<GFormData extends TFormData>(
	fields: TFormFields<GFormData>
): Array<[TFormFieldKey<GFormData>, TFormFields<GFormData>[TFormFieldKey<GFormData>]]> {
	return Object.entries(fields) as Array<
		[TFormFieldKey<GFormData>, TFormFields<GFormData>[TFormFieldKey<GFormData>]]
	>;
}
