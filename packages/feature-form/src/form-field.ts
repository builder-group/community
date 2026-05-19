import { defineFeature, hasFeature } from 'feature-core';
import { createState, type TStateBase } from 'feature-state';
import { deepCopy } from './lib';
import {
	type TFormField,
	type TFormFieldFeature,
	type TFormFieldValidation,
	type TFormFieldValidationConfig,
	type TFormFieldValidator,
	type TValidationStatusValue
} from './types';
import { createFormFieldValidationRunContext } from './validation-context';

/** Creates a reactive form field with validation state and lifecycle flags. */
export function createFormField<GValue>(
	defaultValue: GValue,
	config: TCreateFormFieldConfig<GValue>
): TFormField<GValue> {
	const {
		key,
		validator,
		validateOn = ['submit'],
		revalidateOn = ['blur'],
		collectErrorMode = 'firstError',
		notifyOnStatusUpdate = true
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

	registerFormFieldListeners(formField, notifyOnStatusUpdate);

	return formField;
}

export interface TCreateFormFieldConfig<GValue> extends Partial<TFormFieldValidationConfig> {
	/** Stable field key used in validation contexts and form error paths. */
	key: string;
	validator?: TFormFieldValidator<GValue>;
	/** Calls `field.notify()` when the validation status changes. */
	notifyOnStatusUpdate?: boolean;
}

export function isFormField<GValue = unknown>(value: unknown): value is TFormField<GValue> {
	return hasFeature<TFormFieldFeature<GValue>>(value, 'form-field');
}

function formFieldFeature<GValue>(
	config: TResolvedFormFieldConfig<GValue>
): TFormFieldFeature<GValue> {
	const { key, validation } = config;

	return defineFeature<TFormFieldFeature<GValue>>({
		key: 'form-field',
		install(state: TStateBase<GValue>) {
			return {
				_validation: validation,
				_validationRunId: 0,
				_callbacks: {
					blur: []
				},
				key,
				defaultValue: deepCopy(state._v),
				isTouched: createState(false),
				isSubmitted: createState(false),
				isValidating: createState(false),
				status: createState<TValidationStatusValue>(
					validation == null ? { type: 'valid' } : { type: 'unvalidated' }
				),
				async validate(this: TFormField<GValue>) {
					if (this._validation == null) {
						this.status.set({ type: 'valid' });
						return true;
					}

					const validationRunId = ++this._validationRunId;
					const { collector, context } = createFormFieldValidationRunContext(this);

					this.isValidating.set(true);
					try {
						await this._validation.validator.validate(context);
					} catch (error) {
						collector.registerError({
							code: 'validation_error',
							message: error instanceof Error ? error.message : String(error),
							path: this.key
						});
					} finally {
						if (validationRunId === this._validationRunId) {
							this.isValidating.set(false);
						}
					}

					if (validationRunId !== this._validationRunId) {
						return this.status.get().type === 'valid';
					}

					this.status.set(collector.value ?? { type: 'valid' });

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
					// 'touched' validates on the first blur only; 'blur' validates on every blur
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
					this.status.set(this._validation == null ? { type: 'valid' } : { type: 'unvalidated' });
				}
			};
		}
	});
}

export const formFieldResetSourceKey = 'form-field_reset';

interface TResolvedFormFieldConfig<GValue> {
	key: string;
	validation?: TFormFieldValidation<GValue>;
}

function registerFormFieldListeners<GValue>(
	formField: TFormField<GValue>,
	notifyOnStatusUpdate: boolean
): void {
	if (notifyOnStatusUpdate) {
		formField.status.listen(({ value }) => {
			formField.notify({
				listenerContext: {
					source: formFieldStatusChangeSourceKey,
					status: value
				}
			});
		});
	}

	formField.listen(({ source }) => {
		if (source === formFieldResetSourceKey || source === formFieldStatusChangeSourceKey) {
			return;
		}

		// 'touched' validates on change only after the field has been interacted with at least once
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

export const formFieldStatusChangeSourceKey = 'form-field_status-change';
