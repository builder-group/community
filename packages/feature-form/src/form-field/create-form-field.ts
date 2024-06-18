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
			status._notify(true);
			status.display = true;
			return this.isValid;
		},
		blur(this: TFormField<GValue>) {
			this.isTouched = true;

			if (this._config.reValidateMode === 'onBlur') {
				void this.validate();
			}
		},
		reset(this: TFormField<GValue>) {
			this.set(this._intialValue);
			void this.validate();
			this.status.display = false;
			this.isTouched = false;
		}
	};

	// Merge existing features from the state with the new form field feature
	const _formFieldState = Object.assign(
		formFieldState,
		formFieldFeature
	) as unknown as TFormField<GValue>;

	_formFieldState.listen(async (_, innerFormFieldState) => {
		if (
			innerFormFieldState._config.reValidateMode === 'onChange' ||
			(innerFormFieldState._config.reValidateMode === 'afterFirstSubmit' &&
				innerFormFieldState.isSubmitted)
		) {
			await innerFormFieldState.validate();
		}

		// TODO: recomputeValidatedState
		// TODO: recomputeModifiedState
	});

	return _formFieldState;
}

export interface TCreateFormFieldConfig<GValue> extends Partial<TFormFieldStateConfig> {
	key: string;
	initialValue: GValue;
	validator: TFormFieldValidator<GValue>;
	notifyOnStatusChange?: boolean;
}
