import { bitwiseFlag, deepCopy, type BitwiseFlag, type TEntries } from '@ibg/utils';

import { createFormField } from './form-field';
import {
	FormFieldReValidateMode,
	FormFieldValidateMode,
	type TForm,
	type TFormConfig,
	type TFormData,
	type TFormFields,
	type TFormFieldStateConfig,
	type TFormFieldValidator,
	type TInvalidFormFieldError,
	type TInvalidFormFieldErrors,
	type TInvalidSubmitCallback,
	type TValidSubmitCallback
} from './types';

export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData, ['base']> {
	const {
		fields,
		collectErrorMode = 'firstError',
		disabled = false,
		validateMode = bitwiseFlag(FormFieldValidateMode.OnSubmit),
		reValidateMode = bitwiseFlag(FormFieldReValidateMode.OnBlur),
		onValidSubmit,
		onInvalidSubmit,
		notifyOnStatusChange = true
	} = config;

	const form: TForm<GFormData, ['base']> = {
		_: null,
		_features: ['base'],
		_config: {
			collectErrorMode,
			disabled
		},
		_validSubmitCallbacks: onValidSubmit != null ? [onValidSubmit] : [],
		_invalidSubmitCallbacks: onInvalidSubmit != null ? [onInvalidSubmit] : [],
		fields: Object.fromEntries(
			Object.entries(fields).map(
				([fieldKey, field]: [string, TCreateFormConfigFormField<unknown>]) => [
					fieldKey,
					createFormField(field.defaultValue, {
						key: fieldKey,
						validator: field.validator,
						collectErrorMode: field.collectErrorMode ?? collectErrorMode,
						validateMode: field.validateMode ?? validateMode,
						reValidateMode: field.reValidateMode ?? reValidateMode,
						editable: field.editable ?? true,
						notifyOnStatusChange
					})
				]
			)
		) as TFormFields<GFormData>,
		isValid: false,
		isValidating: false,
		isSubmitted: false,
		isSubmitting: false,
		async _revalidate(this: TForm<GFormData, ['base']>, cached = false) {
			const formFields = Object.values(this.fields) as TFormFields<GFormData>[keyof GFormData][];

			if (!cached) {
				this.isValidating = true;
				await Promise.all(formFields.map((formField) => formField.validate()));
				this.isValidating = false;
			}

			this.isValid = formFields.every((formField) => formField.isValid());
			return this.isValid;
		},
		async submit(this: TForm<GFormData, ['base']>, options = {}) {
			const {
				additionalData,
				assignToInitial = false,
				onInvalidSubmit: _onInvalidSubmit,
				onValidSubmit: _onValidSubmit
			} = options;
			this.isSubmitting = true;

			const validationPromises: Promise<boolean>[] = [];
			for (const formField of Object.values(
				this.fields
			) as TFormFields<GFormData>[keyof GFormData][]) {
				if (
					(formField.isSubmitted &&
						formField._config.reValidateMode.has(FormFieldReValidateMode.OnSubmit)) ||
					(!formField.isSubmitted &&
						formField._config.validateMode.has(FormFieldValidateMode.OnSubmit))
				) {
					validationPromises.push(formField.validate());
				}
				this.isSubmitting = true;
			}
			await Promise.all(validationPromises);

			const data = this.getData();
			if (data != null) {
				const promises = this._validSubmitCallbacks.map((callback) =>
					callback(data, additionalData)
				);
				if (typeof _onValidSubmit === 'function') {
					promises.push(_onValidSubmit(data, additionalData));
				}
				await Promise.all(promises);
			} else {
				const errors = this.getErrors();
				const promises = this._invalidSubmitCallbacks.map((callback) =>
					callback(errors, additionalData)
				);
				if (typeof _onInvalidSubmit === 'function') {
					promises.push(_onInvalidSubmit(errors, additionalData));
				}
				await Promise.all(promises);
			}

			for (const [fieldKey, formField] of Object.entries(this.fields) as TEntries<
				TFormFields<GFormData>
			>) {
				if (data != null && Object.prototype.hasOwnProperty.call(data, fieldKey)) {
					if (assignToInitial) {
						formField._intialValue = deepCopy(data[fieldKey]);
					}
				}
				formField.isSubmitted = true;
				formField.isSubmitting = false;
			}

			this.isSubmitted = true;
			this.isSubmitting = false;

			return this.isValid;
		},
		async validate(this: TForm<GFormData, ['base']>) {
			return this._revalidate(false);
		},
		getField(this: TForm<GFormData, ['base']>, fieldKey) {
			return this.fields[fieldKey];
		},
		getData(this: TForm<GFormData, ['base']>) {
			if (!this.isValid) {
				return null;
			}

			// @ts-expect-error - Filled below
			const preparedData: Readonly<GFormData> = {};

			for (const [fieldKey, formField] of Object.entries(this.fields) as TEntries<
				TFormFields<GFormData>
			>) {
				// @ts-expect-error - GFormFields is based on GFormData and the keys should be identical
				preparedData[fieldKey] = formField.get();
			}

			return preparedData;
		},
		getErrors(this: TForm<GFormData, ['base']>) {
			const errors: TInvalidFormFieldErrors<GFormData> = {};

			for (const [fieldKey, formField] of Object.entries(this.fields) as TEntries<
				TFormFields<GFormData>
			>) {
				switch (formField.status._value.type) {
					case 'INVALID':
						errors[fieldKey] = formField.status._value.errors;
						break;
					case 'UNVALIDATED':
						errors[fieldKey] = [
							{
								code: 'unvalidated',
								message: `${fieldKey.toString()} was not yet validated!`,
								path: fieldKey
							} as TInvalidFormFieldError
						];
						break;
					default:
				}
			}

			return errors;
		},
		reset(this: TForm<GFormData, ['base']>) {
			for (const formField of Object.values(
				this.fields
			) as TFormFields<GFormData>[keyof GFormData][]) {
				formField.reset();
			}
			this.isSubmitted = false;
			// isValid is reset by form field
		}
	};

	for (const field of Object.values(form.fields) as TFormFields<GFormData>[keyof GFormData][]) {
		field.listen(
			async ({ source }) => {
				if (source === 'set') {
					if (
						(field.isSubmitted &&
							field._config.reValidateMode.has(FormFieldReValidateMode.OnChange)) ||
						(!field.isSubmitted &&
							field._config.validateMode.has(FormFieldValidateMode.OnChange)) ||
						(field._config.validateMode.has(FormFieldValidateMode.OnTouched) && field.isTouched)
					) {
						await field.validate();
					}
				}
			},
			{ key: 'form' }
		);
		field.status.listen(
			async () => {
				await form._revalidate(true);
			},
			{ key: 'form' }
		);
	}

	return form;
}

export interface TCreateFormConfig<GFormData extends TFormData> extends Partial<TFormConfig> {
	/**
	 * Form fields
	 */
	fields: TCreateFormConfigFormFields<GFormData>;
	/**
	 * Validation strategy **before** submitting.
	 */
	validateMode?: BitwiseFlag<FormFieldValidateMode>;
	/**
	 * Validation strategy **after** submitting.
	 */
	reValidateMode?: BitwiseFlag<FormFieldReValidateMode>;
	/**
	 * Whether to notify the form field if its status has changed
	 */
	notifyOnStatusChange?: boolean;

	onInvalidSubmit?: TInvalidSubmitCallback<GFormData>;
	onValidSubmit?: TValidSubmitCallback<GFormData>;
}

export type TCreateFormConfigFormFields<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TCreateFormConfigFormField<GFormData[Key]>;
};

export interface TCreateFormConfigFormField<GValue> extends Partial<TFormFieldStateConfig> {
	defaultValue?: GValue;
	validator?: TFormFieldValidator<GValue>;
}

// Helper function to make type inference work
// https://github.com/microsoft/TypeScript/issues/26242
export function fromValidator<GValue>(
	validator: TFormFieldValidator<GValue>,
	config: Omit<TCreateFormConfigFormField<GValue>, 'validator'>
): TCreateFormConfigFormField<GValue> {
	return { validator, ...config };
}
