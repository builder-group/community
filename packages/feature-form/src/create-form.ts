import { createFeatureHost } from 'feature-core';
import { createState } from 'feature-state';
import {
	createFormField,
	formFieldResetSourceKey,
	formFieldStatusChangeSourceKey,
	isFormField
} from './form-field';
import { deepCopy } from './lib';
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
import { createFormValidationRunContext } from './validation-context';

/** Creates a form from field configs or existing form fields. */
export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData, []> {
	const {
		fields,
		fieldValidation = {},
		notifyOnStatusUpdate = true,
		onInvalidSubmit,
		onValidSubmit,
		validation: {
			validator,
			validateOn = ['submit'] satisfies TFormValidationConfig['validateOn'],
			revalidateOn = ['change', 'submit'] satisfies TFormValidationConfig['revalidateOn'],
			collectErrorMode = 'firstError'
		} = {}
	} = config;

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
		_validationStatus: validator == null ? { type: 'valid' } : { type: 'unvalidated' },
		_callbacks: {
			invalidSubmit: onInvalidSubmit == null ? [] : [onInvalidSubmit],
			validSubmit: onValidSubmit == null ? [] : [onValidSubmit]
		},
		status: createState<TValidationStatusValue>({ type: 'unvalidated' }),
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
							collectErrorMode: field.collectErrorMode ?? fieldValidation.collectErrorMode,
							revalidateOn: field.revalidateOn ?? fieldValidation.revalidateOn,
							validateOn: field.validateOn ?? fieldValidation.validateOn,
							notifyOnStatusUpdate
						})
			])
		) as TFormFields<GFormData>,
		async _revalidate(this: TForm<GFormData, []>, options = {}) {
			const { runValidators = true } = options;
			return revalidateForm(this, {
				runFieldValidators: runValidators,
				runFormValidator: runValidators
			});
		},
		async submit(this: TForm<GFormData, []>, options = {}) {
			this.isSubmitting.set(true);
			try {
				await validateFormOnSubmit(this);
				await this._revalidate({ runValidators: false });

				for (const formField of getFormFields(this.fields)) {
					formField.isSubmitted.set(true);
				}
				this.isSubmitted.set(true);

				const data = this.getValidData();
				if (data != null) {
					if (options.updateDefaultValues === true) {
						updateFieldDefaultValues(this.fields, data);
					}

					await runSubmitCallbacks(
						this._callbacks.validSubmit,
						options.onValidSubmit,
						data,
						options.context
					);
					return true;
				}

				const errors = this.getErrors();
				await runSubmitCallbacks(
					this._callbacks.invalidSubmit,
					options.onInvalidSubmit,
					errors,
					options.context
				);
				return false;
			} finally {
				this.isSubmitting.set(false);
			}
		},
		async validate(this: TForm<GFormData, []>) {
			return this._revalidate({ runValidators: true });
		},
		reset(this: TForm<GFormData, []>) {
			for (const formField of getFormFields(this.fields)) {
				formField.reset();
			}
			this._validationRunId++;
			this._validationStatus =
				this._validation == null ? { type: 'valid' } : { type: 'unvalidated' };
			this.status.set(getAggregateFormStatus(this));
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
				form: getFormValidationErrors(this)
			};
		}
	});

	registerFormListeners(form);
	form.status.set(getAggregateFormStatus(form));

	return form;
}

export interface TCreateFormConfig<GFormData extends TFormData> {
	/** Field configs or pre-built form fields keyed by form data property. */
	fields: TCreateFormConfigFormFields<GFormData>;
	/** Optional form-level validator for cross-field constraints. */
	validation?: TCreateFormValidation<GFormData>;
	/** Default validation config applied to field configs that do not override it. */
	fieldValidation?: Partial<TFormFieldValidationConfig>;
	/** Calls `field.notify()` when a field status changes. */
	notifyOnStatusUpdate?: boolean;
	/** Called on every valid submit. Per-call overrides can be passed directly to `submit()`. */
	onValidSubmit?: TFormValidSubmitCallback<GFormData>;
	/** Called on every invalid submit. Per-call overrides can be passed directly to `submit()`. */
	onInvalidSubmit?: TFormInvalidSubmitCallback<GFormData>;
}

export interface TCreateFormValidation<
	GFormData extends TFormData
> extends Partial<TFormValidationConfig> {
	validator: TFormValidator<GFormData>;
}

/** Maps each form data property to a form field config or an existing form field. */
export type TCreateFormConfigFormFields<GFormData extends TFormData> = {
	[Key in TFormFieldKey<GFormData>]:
		| TCreateFormConfigFormField<GFormData[Key]>
		| TFormField<GFormData[Key]>;
};

/** Configures one form field when `createForm()` should create the field. */
export interface TCreateFormConfigFormField<GValue> {
	defaultValue: GValue;
	validator?: TFormFieldValidator<GValue>;
	collectErrorMode?: TFormFieldValidationConfig['collectErrorMode'];
	revalidateOn?: TFormFieldValidationConfig['revalidateOn'];
	validateOn?: TFormFieldValidationConfig['validateOn'];
}

function registerFormListeners<GFormData extends TFormData>(form: TForm<GFormData, []>): void {
	for (const formField of getFormFields(form.fields)) {
		formField.status.listen(() => {
			void form._revalidate({ runValidators: false });
		});

		formField.onBlur(({ wasTouched }) => {
			// 'touched' fires the form validator once on first blur; 'blur' fires it on every blur
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
				runFieldValidators: false,
				runFormValidator: true
			});
		});

		formField.listen(({ source }) => {
			const shouldValidateFormOnFieldChange =
				form._validation != null &&
				source !== formFieldResetSourceKey &&
				source !== formFieldStatusChangeSourceKey &&
				(form.isSubmitted.get()
					? form._validation.config.revalidateOn.includes('change')
					: form._validation.config.validateOn.includes('change'));
			if (!shouldValidateFormOnFieldChange) {
				return;
			}

			void revalidateForm(form, {
				runFieldValidators: false,
				runFormValidator: true
			});
		});
	}
}

async function validateFormOnSubmit<GFormData extends TFormData>(
	form: TForm<GFormData, []>
): Promise<void> {
	const fieldValidationPromises: Array<Promise<boolean>> = [];
	for (const formField of getFormFields(form.fields)) {
		if (formField._validation != null) {
			fieldValidationPromises.push(formField.validate());
		}
	}

	const shouldRunFormValidator = form._validation != null;
	const shouldSetValidating = fieldValidationPromises.length > 0 || shouldRunFormValidator;
	const validationRunId = shouldSetValidating ? ++form._validationRunId : null;
	if (shouldSetValidating) {
		form.isValidating.set(true);
	}

	try {
		await Promise.all([
			...fieldValidationPromises,
			...(shouldRunFormValidator && validationRunId != null
				? [validateFormValidator(form, validationRunId)]
				: [])
		]);
	} finally {
		if (validationRunId != null && validationRunId === form._validationRunId) {
			form.isValidating.set(false);
		}
	}
}

async function revalidateForm<GFormData extends TFormData>(
	form: TForm<GFormData, []>,
	options: TRevalidateFormOptions
): Promise<boolean> {
	const { runFieldValidators, runFormValidator } = options;

	const shouldSetValidating = runFieldValidators || runFormValidator;
	const validationRunId = shouldSetValidating ? ++form._validationRunId : null;
	if (shouldSetValidating) {
		form.isValidating.set(true);
	}

	try {
		await Promise.all([
			...(runFieldValidators ? getFormFields(form.fields).map((field) => field.validate()) : []),
			...(runFormValidator && validationRunId != null
				? [validateFormValidator(form, validationRunId)]
				: [])
		]);
	} finally {
		if (validationRunId != null && validationRunId === form._validationRunId) {
			form.isValidating.set(false);
		}
	}

	const status = getAggregateFormStatus(form);
	form.status.set(status);
	return status.type === 'valid';
}

interface TRevalidateFormOptions {
	runFieldValidators: boolean;
	runFormValidator: boolean;
}

async function validateFormValidator<GFormData extends TFormData>(
	form: TForm<GFormData, []>,
	validationRunId: number
): Promise<void> {
	if (form._validation == null) {
		form._validationStatus = { type: 'valid' };
		return;
	}

	const { collector, context } = createFormValidationRunContext(form);
	try {
		await form._validation.validator.validate(context);
	} catch (error) {
		collector.registerError({
			code: 'validation_error',
			message: error instanceof Error ? error.message : String(error),
			path: 'form'
		});
	}

	if (validationRunId !== form._validationRunId) {
		return;
	}

	form._validationStatus = collector.value ?? { type: 'valid' };
}

function getAggregateFormStatus<GFormData extends TFormData>(
	form: TForm<GFormData, []>
): TFormStatus['value'] {
	const errors: TValidationError[] = [];
	let hasUnvalidatedStatus = false;

	for (const [fieldKey, formField] of getFormFieldEntries(form.fields)) {
		const status = formField.status.get();
		if (status.type === 'invalid') {
			errors.push(
				...status.errors.map((error) => ({
					...error,
					path: error.path ?? fieldKey
				}))
			);
		} else if (status.type === 'unvalidated') {
			hasUnvalidatedStatus = true;
		}
	}

	if (form._validationStatus.type === 'invalid') {
		errors.push(...form._validationStatus.errors);
	} else if (form._validationStatus.type === 'unvalidated') {
		hasUnvalidatedStatus = true;
	}

	if (errors.length > 0) {
		return { type: 'invalid', errors };
	}

	return hasUnvalidatedStatus ? { type: 'unvalidated' } : { type: 'valid' };
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

function getFormValidationErrors<GFormData extends TFormData>(
	form: TForm<GFormData, []>
): readonly TValidationError[] {
	if (form._validationStatus.type === 'invalid') {
		return form._validationStatus.errors;
	}

	return [];
}

function updateFieldDefaultValues<GFormData extends TFormData>(
	fields: TFormFields<GFormData>,
	data: Readonly<GFormData>
): void {
	for (const [fieldKey, formField] of getFormFieldEntries(fields)) {
		formField.defaultValue = deepCopy(data[fieldKey]);
	}
}

async function runSubmitCallbacks<GValue>(
	callbacks: Array<(value: GValue, context?: TFormSubmitContext) => Promise<void> | void>,
	callback: ((value: GValue, context?: TFormSubmitContext) => Promise<void> | void) | undefined,
	value: GValue,
	context: TFormSubmitContext | undefined
): Promise<void> {
	await Promise.all([
		...callbacks.map((_callback) => _callback(value, context)),
		...(callback == null ? [] : [callback(value, context)])
	]);
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
