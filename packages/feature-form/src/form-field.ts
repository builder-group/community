import { defineFeature, hasFeature } from 'feature-core';
import { createState, isEqualFeature, type TStateBase } from 'feature-state';
import { deepCopy } from './lib';
import { validateStandardSchema } from './standard-schema';
import {
	type TFormField,
	type TFormFieldFeature,
	type TFormFieldValidation,
	type TFormFieldValidationConfig,
	type TFormFieldValidator,
	type TValidationStatusValue
} from './types';
import { areValidationStatusesEqual } from './validation-status';

/**
 * Creates a standalone reactive form field.
 *
 * Use this when a field should exist independently of a specific form, for example a shared
 * search input or a field composed into different forms. Pass the result directly into
 * `createForm`'s `fields` config.
 *
 * @param defaultValue - The initial value, also restored by `reset()`.
 * @param config - Field configuration: stable key, optional validator, and trigger settings.
 */
export function createFormField<GValue>(
	defaultValue: GValue,
	config: TCreateFormFieldConfig<GValue>
): TFormField<GValue> {
	const {
		key,
		validator,
		validateOn = ['submit'],
		revalidateOn = ['submit', 'change'],
		collectErrorMode = 'firstError'
	} = config;
	const formField = createState(defaultValue).with(
		formFieldFeature({
			key,
			validation:
				validator == null
					? undefined
					: {
							validator,
							config: {
								validateOn,
								revalidateOn,
								collectErrorMode
							}
						}
		})
	);

	registerFormFieldListeners(formField);

	return formField;
}

export interface TCreateFormFieldConfig<GValue> extends Partial<TFormFieldValidationConfig> {
	/** Stable field key used in validation contexts and form error paths. */
	key: string;
	validator?: TFormFieldValidator<GValue>;
}

export function isFormField<GValue = unknown>(value: unknown): value is TFormField<GValue> {
	return hasFeature<TFormFieldFeature<GValue>>(value, 'form-field');
}

function formFieldFeature<GValue>(
	config: TFormFieldFeatureConfig<GValue>
): TFormFieldFeature<GValue> {
	const { key, validation } = config;

	return defineFeature<TFormFieldFeature<GValue>>({
		key: 'form-field',
		install(state: TStateBase<GValue>) {
			// Note: No validator means there is no pending validation work
			const initialFieldValidatorStatus: TValidationStatusValue =
				validation == null ? { type: 'valid' } : { type: 'unvalidated' };

			return {
				_validation: validation,
				_validationRunId: 0,
				_fieldValidatorStatus: initialFieldValidatorStatus,
				_formValidatorErrors: [],
				_callbacks: {
					blur: []
				},
				key,
				defaultValue: deepCopy(state._v),
				isTouched: createState(false),
				isSubmitted: createState(false),
				isValidating: createState(false),
				status: createState<TValidationStatusValue>(initialFieldValidatorStatus).with(
					isEqualFeature(areValidationStatusesEqual)
				),
				_applyFormValidatorErrors(this: TFormField<GValue>, errors) {
					this._formValidatorErrors = errors;
					this.status.set(getFormFieldStatus(this));
				},
				async validate(this: TFormField<GValue>) {
					if (this._validation == null) {
						this._fieldValidatorStatus = { type: 'valid' };
						this.status.set(getFormFieldStatus(this));
						return this.status.get().type === 'valid';
					}

					const validationRunId = ++this._validationRunId;
					let status: TValidationStatusValue = { type: 'valid' };

					this.isValidating.set(true);
					try {
						status = await validateStandardSchema(
							this._validation.validator,
							this.get(),
							this._validation.config.collectErrorMode
						);
					} catch (error) {
						status = {
							type: 'invalid',
							errors: [
								{
									message: error instanceof Error ? error.message : String(error)
								}
							]
						};
					} finally {
						if (validationRunId === this._validationRunId) {
							this.isValidating.set(false);
						}
					}

					if (validationRunId !== this._validationRunId) {
						return this.status.get().type === 'valid';
					}

					this._fieldValidatorStatus = status;
					this.status.set(getFormFieldStatus(this));
					return this.status.get().type === 'valid';
				},
				onBlur(this: TFormField<GValue>, callback) {
					this._callbacks.blur.push(callback);

					return () => {
						const index = this._callbacks.blur.indexOf(callback);
						if (index !== -1) {
							this._callbacks.blur.splice(index, 1);
						}
					};
				},
				blur(this: TFormField<GValue>) {
					const wasTouched = this.isTouched.get();
					// Note: 'touched' validates on the first blur only; 'blur' validates on every blur
					const shouldValidateOnBlur =
						this._validation != null &&
						(this.isSubmitted.get()
							? this._validation.config.revalidateOn.includes('blur')
							: this._validation.config.validateOn.includes('blur') ||
								(this._validation.config.validateOn.includes('touched') && !wasTouched));
					if (shouldValidateOnBlur) {
						void this.validate();
					}

					this.isTouched.set(true);
					for (const callback of this._callbacks.blur) {
						callback({ wasTouched });
					}
				},
				reset(this: TFormField<GValue>) {
					this.set(deepCopy(this.defaultValue), {
						listenerContext: { source: formFieldResetSourceKey }
					});
					this._validationRunId++;
					this.isTouched.set(false);
					this.isSubmitted.set(false);
					this.isValidating.set(false);
					this._formValidatorErrors = [];
					this._fieldValidatorStatus =
						this._validation == null ? { type: 'valid' } : { type: 'unvalidated' };
					this.status.set(getFormFieldStatus(this));
				}
			};
		}
	});
}

/** Identifies listener events caused by field reset so validation can ignore reset changes. */
export const formFieldResetSourceKey = 'formFieldReset';

interface TFormFieldFeatureConfig<GValue> {
	key: string;
	validation?: TFormFieldValidation<GValue>;
}

function registerFormFieldListeners<GValue>(formField: TFormField<GValue>): void {
	formField.listen(({ source }) => {
		if (source === formFieldResetSourceKey) {
			return;
		}

		// Note: 'touched' validates pre-submit changes after the field has been blurred once
		const shouldValidateOnChange =
			formField._validation != null &&
			(formField.isSubmitted.get()
				? formField._validation.config.revalidateOn.includes('change')
				: formField._validation.config.validateOn.includes('change') ||
					(formField._validation.config.validateOn.includes('touched') &&
						formField.isTouched.get()));
		if (shouldValidateOnChange) {
			void formField.validate();
		}
	});
}

function getFormFieldStatus<GValue>(formField: TFormField<GValue>): TValidationStatusValue {
	const errors =
		formField._fieldValidatorStatus.type === 'invalid'
			? [...formField._fieldValidatorStatus.errors, ...formField._formValidatorErrors]
			: formField._formValidatorErrors;
	if (errors.length > 0) {
		return { type: 'invalid', errors };
	}

	return formField._fieldValidatorStatus;
}
