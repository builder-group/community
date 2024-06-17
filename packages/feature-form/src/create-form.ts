import { shortId } from '@ibg/utils';

import { createFormField } from './create-form-field';
import { TForm, TFormConfig, TFormData, TFormState, TFormValidators } from './types';

// TODO: Should form also be a state?
export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData, ['base']> {
	const {
		initialValues,
		validators,
		collectErrorMode = 'firstError',
		disabled = false,
		key = shortId(),
		mode = 'onBlur',
		reValidateMode = 'onBlur',
		onSubmit = null
	} = config;

	const data: TFormState<GFormData> = {} as TFormState<GFormData>;
	for (const key in initialValues) {
		data[key] = createFormField({
			key,
			initialValue: initialValues[key],
			validator: validators[key],
			collectErrorMode,
			reValidateMode,
			editable: true
		});
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
		_data: data,
		key,
		isModified: false,
		isValid: false,
		submitted: false
	};
}

export interface TCreateFormConfig<GFormData extends TFormData>
	extends Partial<TFormConfig<GFormData>> {
	key?: string;
	initialValues: GFormData;
	validators: TFormValidators<GFormData>;
}
