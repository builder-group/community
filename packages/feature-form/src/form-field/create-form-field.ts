import { createState } from 'feature-state';
import { deepCopy } from '@ibg/utils';

import {
	type TFormField,
	type TFormFieldStateConfig,
	type TFormFieldStateFeature,
	type TFormFieldValidator
} from '../types';
import { createFormFieldStatus } from './create-form-field-status';

export function createFormField<GValue>(
	config: TCreateFormFieldConfig<GValue>
): TFormField<GValue> {
	const {
		initialValue,
		key,
		validator,
		editable = true,
		reValidateMode = 'onBlur',
		validateMode = 'onSubmit',
		collectErrorMode = 'firstError',
		notifyOnStatusChange = true
	} = config;
	const formFieldState = createState(initialValue);

	formFieldState._features.push('form-field');

	const status = createFormFieldStatus({ type: 'UNVALIDATED' });

	// Notify form field listeners if status has changed
	if (notifyOnStatusChange) {
		status.listen(() => {
			formFieldState._notify(true);
		});
	}

	const formFieldFeature: TFormFieldStateFeature<GValue> = {
		_config: {
			editable,
			validateMode,
			reValidateMode,
			collectErrorMode
		},
		_intialValue: deepCopy(formFieldState._value),
		_validator: validator,
		key,
		isValid: false,
		isTouched: false,
		isSubmitted: false,
		status,
		async validate(this: TFormField<GValue>) {
			this.isValid = await this._validator.validate(this);
			this.status._notify(true);
			return this.isValid;
		},
		blur(this: TFormField<GValue>) {
			if (
				(this.isSubmitted && this._config.reValidateMode === 'onBlur') ||
				(!this.isSubmitted &&
					(this._config.validateMode === 'onBlur' ||
						(this._config.validateMode === 'onTouched' && !this.isTouched)))
			) {
				void this.validate();
			}

			this.isTouched = true;
		},
		reset(this: TFormField<GValue>) {
			this.set(this._intialValue);
			this.isTouched = false;
			this.isSubmitted = false;
			this.isValid = false;
			this.status.set({ type: 'UNVALIDATED' });
		}
	};

	// Merge existing features from the state with the new form field feature
	return Object.assign(formFieldState, formFieldFeature) as unknown as TFormField<GValue>;
}

export interface TCreateFormFieldConfig<GValue, GInitalValue extends GValue = GValue>
	extends Partial<TFormFieldStateConfig> {
	key: string;
	initialValue: GInitalValue;
	validator: TFormFieldValidator<GValue>;
	notifyOnStatusChange?: boolean;
}
