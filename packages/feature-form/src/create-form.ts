import { createState } from 'feature-state';
import { shortId } from '@ibg/utils';

import { createFormField } from './form-field';
import {
	type TForm,
	type TFormConfig,
	type TFormData,
	type TFormFields,
	type TFormFieldValidator
} from './types';

export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData, ['base']> {
	const {
		fields,
		collectErrorMode = 'firstError',
		disabled = false,
		key = shortId(),
		mode = 'onBlur',
		reValidateMode = 'onBlur',
		onSubmit = null,
		notifyOnFromFieldChange = true
	} = config;

	const fieldsState = createState(
		Object.fromEntries(
			Object.entries(fields).map(([fieldKey, field]) => [
				fieldKey,
				createFormField({
					key,
					initialValue: field.initalValue,
					validator: field.validator,
					collectErrorMode,
					reValidateMode,
					editable: true
				})
			])
		) as TFormFields<GFormData>
	);

	// Notify form listeners if form field has changed
	if (notifyOnFromFieldChange) {
		for (const formField of Object.values(fieldsState._value)) {
			formField.listen(() => {
				fieldsState._notify(true);
			});
		}
	}

	return {
		_: null,
		_features: ['base'],
		_config: {
			collectErrorMode,
			disabled,
			mode,
			reValidateMode,
			onSubmit
		},
		key,
		fields: fieldsState,
		isModified: false,
		isValid: false,
		isSubmitted: false,
		getField(this: TForm<GFormData, ['base']>, fieldKey) {
			return this.fields.get()[fieldKey];
		},
		submit(this: TForm<GFormData, ['base']>) {
			// @ts-expect-error - Filled in a second
			const preparedData: GFormData = {};
			for (const [fieldKey, formField] of Object.entries(this.fields._value)) {
				if (this._config.reValidateMode === 'onSubmit') {
					void formField.validate();
				}
				formField.isSubmitted = true;

				// @ts-expect-error - GFormFields is based on GFormData and the keys should be identical
				preparedData[fieldKey] = formField.get();
			}

			this.isSubmitted = true;

			this._config.onSubmit?.(preparedData);
		},
		reset(this: TForm<GFormData, ['base']>) {
			for (const formField of Object.values(this.fields._value)) {
				formField.reset();
			}
			this.isModified = false;
			this.isSubmitted = false;
		}
	};
}

export interface TCreateFormConfig<GFormData extends TFormData>
	extends Partial<TFormConfig<GFormData>> {
	key?: string;
	fields: TCreateFormConfigFormFields<GFormData>;
	notifyOnFromFieldChange?: boolean;
}

type TCreateFormConfigFormFields<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TCreateFormConfigFormField<GFormData[Key]>;
};

interface TCreateFormConfigFormField<GValue> {
	initalValue: GValue;
	validator: TFormFieldValidator<GValue>;
}
