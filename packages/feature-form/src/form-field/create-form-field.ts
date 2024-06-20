import { createState } from 'feature-state';
import { deepCopy } from '@ibg/utils';

import {
	type TFormField,
	type TFormFieldStateConfig,
	type TFormFieldStateFeature,
	type TFormFieldValidator
} from '../types';
import { createStatus } from './create-status';

export function createFormField<GValue>(
	initialValue: GValue | undefined,
	config: TCreateFormFieldConfig<GValue>
): TFormField<GValue> {
	const {
		key,
		validator,
		editable = true,
		reValidateMode = 'onBlur',
		validateMode = 'onSubmit',
		collectErrorMode = 'firstError',
		notifyOnStatusChange = true
	} = config;
	const formFieldState = createState(initialValue);

	const status = createStatus({ type: 'UNVALIDATED' });

	// Notify form field listeners if status has changed
	if (notifyOnStatusChange) {
		status.listen(
			() => {
				formFieldState._notify();
			},
			{ key: 'form-field' }
		);
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
	const _formField = Object.assign(
		formFieldState,
		formFieldFeature
	) as unknown as TFormField<GValue>;
	_formField._features.push('form-field');

	return _formField;
}

export interface TCreateFormFieldConfig<GValue> extends Partial<TFormFieldStateConfig> {
	key: string;
	validator: TFormFieldValidator<GValue>;
	notifyOnStatusChange?: boolean;
}
