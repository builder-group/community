import { createState, TSelectFeatures, TState } from 'feature-state';
import { WithOptional } from '@ibg/utils';

import { createFormFieldStatus } from './create-form-field-status';
import { TFormField, TFormFieldStateConfig, TFormFieldValidator } from './types';

export function createFormField<GValue>(
	config: TCreateFormFieldConfig<GValue>
): TFormField<GValue> {
	const { initialValue, key, validator, editable = true } = config;
	const formFieldState = createState(initialValue);

	formFieldState._features.push('form-field');

	const formFieldFeature: TSelectFeatures<GValue, ['form-field']> = {
		_config: {
			key,
			editable
		},
		isTouched: false,
		status: createFormFieldStatus({ type: 'UNKOWN' }),
		validator,
		blur(this: TState<GValue, ['form-field']>) {
			this.isTouched = true;
		},
		reset(this: TState<GValue, ['form-field']>) {
			this.set(initialValue);
			this.isTouched = false;
		}
	};

	// Merge existing features from the state with the new undo feature
	const _formFieldState = Object.assign(formFieldState, formFieldFeature);

	return _formFieldState as TFormField<GValue>;
}

export interface TCreateFormFieldConfig<GValue>
	extends WithOptional<TFormFieldStateConfig, 'editable'> {
	initialValue: GValue;
	validator: TFormFieldValidator<GValue>;
}
