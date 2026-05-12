import { bitwiseFlag, deepCopy, withNew } from '@blgc/utils';
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
		isTouched: createState(false),
		isSubmitted: createState(false),
		isSubmitting: createState(false),
		isValidating: createState(false),
		status: createStatus({ type: 'UNVALIDATED' }),
		async validate(this: TFormField<GValue>) {
			const validationContext = createFormFieldValidationContext(this);

			this.isValidating.set(true);
			await this._validator.validate(validationContext);
			this.isValidating.set(false);

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
				(this.isSubmitted.get() &&
					this._config.reValidateMode.has(FormFieldReValidateMode.OnBlur)) ||
				(!this.isSubmitted.get() &&
					(this._config.validateMode.has(FormFieldValidateMode.OnBlur) ||
						(this._config.validateMode.has(FormFieldValidateMode.OnTouched) &&
							!this.isTouched.get())))
			) {
				void this.validate();
			}

			this.isTouched.set(true);
		},
		reset(this: TFormField<GValue>) {
			this.set(this._intialValue, { listenerContext: { source: 'form-field_reset' } });
			this.isTouched.set(false);
			this.isSubmitted.set(false);
			this.isSubmitting.set(false);
			this.status.set({ type: 'UNVALIDATED' });
		}
	};

	// Extend the base state with the form field feature
	const formField = Object.assign(baseState, formFieldFeature) as TFormField<GValue>;
	formField._features.push('form-field');

	return withNew<TFormField<GValue>, [boolean]>(
		Object.assign(formField, {
			_new(this: TFormField<GValue>, notifyOnStatusChange: boolean) {
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

				// Validate on change
				this.listen(
					async ({ source }) => {
						// Skip non-value changes so they do not trigger value-change validation
						if (source === 'form-field_reset' || source === 'form-field_status-change') {
							return;
						}

						if (
							(this.isSubmitted.get() &&
								this._config.reValidateMode.has(FormFieldReValidateMode.OnChange)) ||
							(!this.isSubmitted.get() &&
								this._config.validateMode.has(FormFieldValidateMode.OnChange)) ||
							(this._config.validateMode.has(FormFieldValidateMode.OnTouched) &&
								this.isTouched.get())
						) {
							await this.validate();
						}
					},
					{ key: 'form-field_validate' }
				);
			}
		}),
		notifyOnStatusChange
	);
}

export interface TCreateFormFieldConfig<GValue> extends Partial<TFormFieldStateConfig> {
	key: string;
	validator?: TFormFieldValidator<GValue>;
	notifyOnStatusChange?: boolean;
}
