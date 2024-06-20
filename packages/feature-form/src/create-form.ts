import { type TEntries } from '@ibg/utils';

import { createFormField } from './form-field';
import {
	type TForm,
	type TFormConfig,
	type TFormData,
	type TFormFieldReValidateMode,
	type TFormFields,
	type TFormFieldStateConfig,
	type TFormFieldValidateMode,
	type TFormFieldValidator
} from './types';

export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData, ['base']> {
	const {
		fields,
		collectErrorMode = 'firstError',
		disabled = false,
		validateMode = 'onSubmit',
		reValidateMode = 'onBlur',
		onSubmit = null
	} = config;

	const form: TForm<GFormData, ['base']> = {
		_: null,
		_features: ['base'],
		_config: {
			collectErrorMode,
			disabled,
			onSubmit
		},
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
						editable: field.editable ?? true
					})
				]
			)
		) as TFormFields<GFormData>,
		isValid: false,
		isSubmitted: false,
		async _revalidate(this: TForm<GFormData, ['base']>, cached = false) {
			let isValid = true;

			for (const formField of Object.values(
				this.fields
			) as TFormFields<GFormData>[keyof GFormData][]) {
				if (cached) {
					isValid = formField.isValid && isValid;
				} else {
					isValid = (await formField.validate()) && isValid;
				}
			}

			this.isValid = isValid;
			return isValid;
		},
		async submit(this: TForm<GFormData, ['base']>) {
			// @ts-expect-error - Filled below
			const preparedData: GFormData = {};

			for (const [fieldKey, formField] of Object.entries(this.fields) as TEntries<
				TFormFields<GFormData>
			>) {
				if (
					(formField.isSubmitted && formField._config.reValidateMode === 'onSubmit') ||
					(!formField.isSubmitted && formField._config.validateMode === 'onSubmit')
				) {
					await formField.validate();
				}
				formField.isSubmitted = true;

				// @ts-expect-error - GFormFields is based on GFormData and the keys should be identical
				preparedData[fieldKey] = formField.get();
			}

			this.isSubmitted = true;

			if (this.isValid) {
				this._config.onSubmit?.(preparedData);
			}
			return this.isValid;
		},
		async validate(this: TForm<GFormData, ['base']>) {
			return this._revalidate(false);
		},
		getField(this: TForm<GFormData, ['base']>, fieldKey) {
			return this.fields[fieldKey];
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
		field.listen(async () => {
			if (
				(field.isSubmitted && field._config.reValidateMode === 'onChange') ||
				(!field.isSubmitted && field._config.validateMode === 'onChange') ||
				(field._config.validateMode === 'onTouched' && field.isTouched)
			) {
				await field.validate();
			}
		});
		field.status.listen(async () => {
			await form._revalidate(true);
		});
	}

	return form;
}

export interface TCreateFormConfig<GFormData extends TFormData>
	extends Partial<TFormConfig<GFormData>> {
	/**
	 * Form fields
	 */
	fields: TCreateFormConfigFormFields<GFormData>;
	/**
	 * Validation strategy after submitting.
	 */
	validateMode?: TFormFieldValidateMode;
	/**
	 * Validation strategy before submitting.
	 */
	reValidateMode?: TFormFieldReValidateMode;
}

export type TCreateFormConfigFormFields<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TCreateFormConfigFormField<GFormData[Key]>;
};

export interface TCreateFormConfigFormField<GValue> extends Partial<TFormFieldStateConfig> {
	defaultValue?: GValue;
	validator: TFormFieldValidator<GValue>;
}

// Helper function to make type inference work
// https://github.com/microsoft/TypeScript/issues/26242
export function fromValidator<GValue>(
	validator: TFormFieldValidator<GValue>,
	config: Omit<TCreateFormConfigFormField<GValue>, 'validator'>
): TCreateFormConfigFormField<GValue> {
	return { validator, ...config };
}
