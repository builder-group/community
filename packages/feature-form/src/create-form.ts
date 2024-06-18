import { createState } from 'feature-state';
import { shortId } from '@ibg/utils';

import { createFormField } from './form-field';
import {
	type TExtractGFormDataTFormFields,
	type TForm,
	type TFormConfig,
	type TFormData,
	type TFormFields,
	type TFormFieldValidator,
	type TFormStateFeature
} from './types';

export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData> {
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

	const formState = createState(
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

	formState._features.push('form');

	// Notify form listeners if form field has changed
	if (notifyOnFromFieldChange) {
		for (const formField of Object.values(formState._value)) {
			formField.listen(() => {
				formState._notify(true);
			});
		}
	}

	const formFeature: TFormStateFeature<TFormFields<GFormData>> = {
		_config: {
			collectErrorMode,
			disabled,
			mode,
			reValidateMode,
			onSubmit: onSubmit as NonNullable<
				TCreateFormConfig<TExtractGFormDataTFormFields<TFormFields<GFormData>>>['onSubmit']
			> // TODO: Fix type
		},
		key,
		isModified: false,
		isValid: false,
		submitted: false,
		getField(this: TForm<GFormData>, fieldKey) {
			return this._value[fieldKey];
		},
		submit(this: TForm<GFormData>) {
			const preparedData: Record<string, unknown> = {};
			for (const [fieldKey, formField] of Object.entries(this._value)) {
				if (
					this._config.reValidateMode === 'onSubmit' ||
					(this._config.reValidateMode === 'afterFirstSubmit' && !this.submitted)
				) {
					formField.propagateStatus();
				}

				preparedData[fieldKey] = formField.get();
			}

			this.submitted = true;

			// TODO: Fix type
			this._config.onSubmit?.(preparedData as TExtractGFormDataTFormFields<TFormFields<GFormData>>);
		},
		reset(this: TForm<GFormData>) {
			for (const formField of Object.values(this._value)) {
				formField.reset();
			}
			this.isModified = false;
			this.submitted = false;
		}
	};

	// Merge existing features from the state with the new form feature
	return Object.assign(formState, formFeature) as unknown as TForm<GFormData>;
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
