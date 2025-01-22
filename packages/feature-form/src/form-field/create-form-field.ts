import { TWithInit } from '@blgc/types/features';
import { bitwiseFlag, deepCopy } from '@blgc/utils';
import { createState } from 'feature-state';
import { createValidator } from 'validation-adapter';
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
	const baseState = createState(initialValue);

	const formFieldFeature: TFormFieldStateFeature<GValue>['api'] = {
		_config: {
			editable,
			validateMode,
			reValidateMode,
			collectErrorMode
		},
		_intialValue: deepCopy(baseState._v),
		_validator: validator,
		key,
		isTouched: false,
		isSubmitted: false,
		isSubmitting: false,
		isValidating: false,
		status: createStatus({ type: 'UNVALIDATED' }),
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
			this.set(this._intialValue, { listenerContext: { source: 'form-field_reset' } });
			this.isTouched = false;
			this.isSubmitted = false;
			this.isSubmitting = false;
			this.status.set({ type: 'UNVALIDATED' });
		}
	};

	// Extend the base state with the form field feature
	const formField = Object.assign(baseState, formFieldFeature, {
		init(this: TFormField<GValue>, { notifyOnStatusChange }: TInitFormFieldConfig) {
			// Notify form field listeners if status has changed
			if (notifyOnStatusChange) {
				this.status.listen(
					(data) => {
						baseState._notify({
							listenerContext: { source: 'form-field_status-change', status: data.value }
						});
					},
					{ key: 'form-field_status-change' }
				);
			}

			// @ts-expect-error -- Remove init method after initialization
			delete this.init;
			return this;
		}
	}) as TWithInit<TFormField<GValue>, TInitFormFieldConfig>;
	formField._features.push('form-field');

	return formField.init({ notifyOnStatusChange });
}

export interface TCreateFormFieldConfig<GValue> extends Partial<TFormFieldStateConfig> {
	key: string;
	validator?: TFormFieldValidator<GValue>;
	notifyOnStatusChange?: boolean;
}

interface TInitFormFieldConfig {
	notifyOnStatusChange?: boolean;
}
