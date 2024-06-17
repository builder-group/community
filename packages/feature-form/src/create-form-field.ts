import { createState, TSelectFeatures } from 'feature-state';

import { createFormFieldStatus } from './create-form-field-status';
import { TFormField, TFormFieldStateConfig, TFormFieldValidator } from './types';

export function createFormField<GValue>(
	config: TCreateFormFieldConfig<GValue>
): TFormField<GValue> {
	const {
		initialValue,
		key,
		validator,
		editable = true,
		reValidateMode = 'onBlur',
		collectErrorMode = 'firstError'
	} = config;
	const formFieldState = createState(initialValue);

	formFieldState._features.push('form-field');

	const formFieldFeature: TSelectFeatures<GValue, ['form-field']> = {
		_config: {
			editable,
			reValidateMode,
			collectErrorMode
		},
		key: key,
		isTouched: false,
		status: createFormFieldStatus({ type: 'UNVALIDATED' }),
		validator,
		validate(this: TFormField<GValue>) {
			return this.validator.validate(this);
		},
		blur(this: TFormField<GValue>) {
			this.isTouched = true;

			if (this._config.reValidateMode) {
				this.status.display = true;
				this.status._notify(true);
			}
		},
		reset(this: TFormField<GValue>) {
			this.set(initialValue);
			this.status.display = false;
			this.isTouched = false;
		}
	};

	// Merge existing features from the state with the new undo feature
	const _formFieldState = Object.assign(formFieldState, formFieldFeature);

	return _formFieldState as TFormField<GValue>;
}

export interface TCreateFormFieldConfig<GValue> extends Partial<TFormFieldStateConfig> {
	key: string;
	initialValue: GValue;
	validator: TFormFieldValidator<GValue>;
}
