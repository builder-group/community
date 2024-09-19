import { createState } from 'feature-state';
import { createValidator } from 'validation-adapter';
import { bitwiseFlag, deepCopy } from '@blgc/utils';

import {
	FormFieldReValidateMode,
	FormFieldValidateMode,
	type TFormField,
	type TFormFieldStateConfig,
	type TFormFieldStateFeature,
	type TFormFieldValidator
} from '../types';
import { createFormFieldValidationContext } from './create-form-field-validation-context';
import { createStatus } from './create-status';

export function createFormField<GValue>(
	initialValue: GValue | undefined,
	config: TCreateFormFieldConfig<GValue>
): TFormField<GValue> {
	const {
		key,
		validator = createValidator([]),
		editable = true,
		reValidateMode = bitwiseFlag(FormFieldReValidateMode.OnBlur),
		validateMode = bitwiseFlag(FormFieldValidateMode.OnSubmit),
		collectErrorMode = 'firstError',
		notifyOnStatusChange = true
	} = config;
	const formFieldState = createState(initialValue, { deferred: false });

	const status = createStatus({ type: 'UNVALIDATED' });

	// Notify form field listeners if status has changed
	if (notifyOnStatusChange) {
		status.listen(
			(data) => {
				formFieldState._notify({ additionalData: { source: 'status', status: data.value } });
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
		isTouched: false,
		isSubmitted: false,
		isSubmitting: false,
		isValidating: false,
		status,
		async validate(this: TFormField<GValue>) {
			const validationContext = createFormFieldValidationContext(this);

			this.isValidating = true;
			await this._validator.validate(validationContext);
			this.isValidating = false;

			// If no error was registered we assume its valid
			if (this.status._nextValue == null) {
				this.status.set({ type: 'VALID' });
			} else {
				this.status.set(this.status._nextValue);
			}

			this.status._nextValue = undefined;

			return this.status.get().type === 'VALID';
		},
		isValid(this: TFormField<GValue>) {
			return this.status.get().type === 'VALID';
		},
		blur(this: TFormField<GValue>) {
			if (
				(this.isSubmitted && this._config.reValidateMode.has(FormFieldReValidateMode.OnBlur)) ||
				(!this.isSubmitted &&
					(this._config.validateMode.has(FormFieldValidateMode.OnBlur) ||
						(this._config.validateMode.has(FormFieldValidateMode.OnTouched) && !this.isTouched)))
			) {
				void this.validate();
			}

			this.isTouched = true;
		},
		reset(this: TFormField<GValue>) {
			this.set(this._intialValue, { additionalData: { source: 'reset' } });
			this.isTouched = false;
			this.isSubmitted = false;
			this.isSubmitting = false;
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
	validator?: TFormFieldValidator<GValue>;
	notifyOnStatusChange?: boolean;
}
