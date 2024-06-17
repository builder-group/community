import { createState, TSelectFeatures } from 'feature-state';
import { shortId } from '@ibg/utils';

import { createFormField } from './create-form-field';
import { TForm, TFormConfig, TFormData, TFormState, TFormValidators } from './types';

export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData> {
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

	const formState = createState(data);

	formState._features.push('form');

	const formFeature: TSelectFeatures<GFormData, ['form']> = {
		_config: {
			collectErrorMode,
			disabled,
			mode,
			reValidateMode,
			onSubmit
		},
		key,
		isModified: false,
		isValid: false,
		submitted: false
	};

	// Merge existing features from the state with the new undo feature
	const _formState = Object.assign(formState, formFeature);

	return _formState as TForm<GFormData>;
}

export interface TCreateFormConfig<GFormData extends TFormData>
	extends Partial<TFormConfig<GFormData>> {
	key?: string;
	initialValues: GFormData;
	validators: TFormValidators<GFormData>;
}
