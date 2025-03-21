import { type TEntries } from '@blgc/types/utils';
import { bitwiseFlag, deepCopy, withNew, type BitwiseFlag } from '@blgc/utils';
import { createState } from 'feature-state';
import { TCollectErrorMode } from 'validation-adapter';
import { createFormField, isFormField } from './form-field';
import {
	FormFieldReValidateMode,
	FormFieldValidateMode,
	TFormField,
	type TForm,
	type TFormConfig,
	type TFormData,
	type TFormFields,
	type TFormFieldStateConfig,
	type TFormFieldValidator,
	type TInvalidFormFieldError,
	type TInvalidFormFieldErrors,
	type TInvalidSubmitCallback,
	type TSubmitCallbackResponse,
	type TValidSubmitCallback
} from './types';

export function createForm<GFormData extends TFormData>(
	config: TCreateFormConfig<GFormData>
): TForm<GFormData, []> {
	const {
		fields,
		collectErrorMode = 'firstError',
		disabled = false,
		validateMode = bitwiseFlag(FormFieldValidateMode.OnSubmit),
		reValidateMode = bitwiseFlag(FormFieldReValidateMode.OnBlur),
		onValidSubmit,
		onInvalidSubmit,
		notifyOnStatusChange = true
	} = config;

	return withNew<TForm<GFormData, []>>({
		_features: [],
		_config: {
			disabled
		},
		_validSubmitCallbacks: onValidSubmit != null ? [onValidSubmit] : [],
		_invalidSubmitCallbacks: onInvalidSubmit != null ? [onInvalidSubmit] : [],
		fields: Object.fromEntries(
			Object.entries(fields).map(
				([fieldKey, field]: [
					string,
					TCreateFormConfigFormField<unknown> | TFormField<unknown>
				]) => [
					fieldKey,
					isFormField(field)
						? field
						: createFormField(field.defaultValue, {
								key: fieldKey,
								validator: field.validator,
								collectErrorMode: field.collectErrorMode ?? collectErrorMode,
								validateMode: field.validateMode ?? validateMode,
								reValidateMode: field.reValidateMode ?? reValidateMode,
								editable: field.editable ?? true,
								notifyOnStatusChange
							})
				]
			)
		) as TFormFields<GFormData>,
		isValid: createState(false),
		isValidating: createState(false),
		isSubmitted: createState(false),
		isSubmitting: createState(false),
		_new(this: TForm<GFormData, []>) {
			// Revalidate form on status change
			for (const field of Object.values(this.fields)) {
				field.status.listen(
					async () => {
						await this._revalidate(true);
					},
					{ key: 'form_revalidate' }
				);
			}
		},
		async _revalidate(this: TForm<GFormData, []>, cached = false) {
			const formFields = Object.values(this.fields) as TFormFields<GFormData>[keyof GFormData][];

			if (!cached) {
				this.isValidating.set(true);
				await Promise.all(formFields.map((formField) => formField.validate()));
				this.isValidating.set(false);
			}

			this.isValid.set(formFields.every((formField) => formField.isValid()));
			return this.isValid.get();
		},
		async submit(this: TForm<GFormData, []>, options = {}) {
			const {
				context,
				assignToInitial = false,
				onInvalidSubmit: _onInvalidSubmit,
				onValidSubmit: _onValidSubmit,
				postSubmitCallback
			} = options;
			this.isSubmitting.set(true);

			// Validate form fields
			const validationPromises: Promise<boolean>[] = [];
			for (const formField of Object.values(
				this.fields
			) as TFormFields<GFormData>[keyof GFormData][]) {
				formField.isSubmitting.set(true);
				if (
					(formField.isSubmitted.get() &&
						formField._config.reValidateMode.has(FormFieldReValidateMode.OnSubmit)) ||
					(!formField.isSubmitted.get() &&
						formField._config.validateMode.has(FormFieldValidateMode.OnSubmit))
				) {
					validationPromises.push(formField.validate());
				}
			}
			await Promise.all(validationPromises);

			// Note: We can't rely on the form field status listener to revalidate the form on time
			// since the state queue is processed asynchronously
			this._revalidate(true);

			// Execute submit callbacks
			const data = this.getValidData();
			const submitCallbackPromises: TSubmitCallbackResponse[] = [];
			if (data != null) {
				for (const callback of this._validSubmitCallbacks) {
					submitCallbackPromises.push(callback(data, context));
				}
				if (typeof _onValidSubmit === 'function') {
					submitCallbackPromises.push(_onValidSubmit(data, context));
				}
			} else {
				const errors = this.getErrors();
				for (const callback of this._invalidSubmitCallbacks) {
					submitCallbackPromises.push(callback(errors, context));
				}
				if (typeof _onInvalidSubmit === 'function') {
					submitCallbackPromises.push(_onInvalidSubmit(errors, context));
				}
			}

			let submitCallbackData: Record<string, unknown> | null = null;
			if (postSubmitCallback != null) {
				submitCallbackData = (await Promise.all(submitCallbackPromises)).reduce((acc, result) => {
					if (result != null && typeof result === 'object') {
						return { ...acc, ...result };
					}
					return acc;
				}, {}) as Record<string, unknown>;
			} else {
				await Promise.all(submitCallbackPromises);
			}

			// Update form field states
			for (const [fieldKey, formField] of Object.entries(this.fields) as TEntries<
				TFormFields<GFormData>
			>) {
				if (data != null && Object.prototype.hasOwnProperty.call(data, fieldKey)) {
					if (assignToInitial) {
						formField._intialValue = deepCopy(data[fieldKey]);
					}
				}
				formField.isSubmitted.set(true);
				formField.isSubmitting.set(false);
			}

			this.isSubmitted.set(true);
			this.isSubmitting.set(false);

			postSubmitCallback?.(this, submitCallbackData ?? {});
			return this.isValid.get();
		},
		async validate(this: TForm<GFormData, []>) {
			return this._revalidate(false);
		},
		getField(this: TForm<GFormData, []>, fieldKey) {
			return this.fields[fieldKey];
		},
		getValidData(this: TForm<GFormData, []>) {
			if (!this.isValid.get()) {
				return null;
			}

			// @ts-expect-error - Filled below
			const preparedData: Readonly<GFormData> = {};

			for (const [fieldKey, formField] of Object.entries(this.fields) as TEntries<
				TFormFields<GFormData>
			>) {
				// @ts-expect-error - GFormFields is based on GFormData and the keys should be identical
				preparedData[fieldKey] = formField.get();
			}

			return preparedData;
		},
		getErrors(this: TForm<GFormData, []>) {
			const errors: TInvalidFormFieldErrors<GFormData> = {};

			for (const [fieldKey, formField] of Object.entries(this.fields) as TEntries<
				TFormFields<GFormData>
			>) {
				switch (formField.status._v.type) {
					case 'INVALID':
						errors[fieldKey] = formField.status._v.errors;
						break;
					case 'UNVALIDATED':
						errors[fieldKey] = [
							{
								code: 'unvalidated',
								message: `${fieldKey.toString()} was not yet validated!`,
								path: fieldKey
							} as TInvalidFormFieldError
						];
						break;
					default:
				}
			}

			return errors;
		},
		reset(this: TForm<GFormData, []>) {
			for (const formField of Object.values(
				this.fields
			) as TFormFields<GFormData>[keyof GFormData][]) {
				formField.reset();
			}
			this.isSubmitted.set(false);
			this._revalidate(true);
		}
	});
}

export interface TCreateFormConfig<GFormData extends TFormData> extends Partial<TFormConfig> {
	/**
	 * Form fields
	 */
	fields: TCreateFormConfigFormFields<GFormData>;
	/**
	 * Error collection mode. 'firstError' gathers only the first error per field, 'all' gathers all errors.
	 */
	collectErrorMode?: TCollectErrorMode;
	/**
	 * Validation strategy **before** submitting.
	 */
	validateMode?: BitwiseFlag<FormFieldValidateMode>;
	/**
	 * Validation strategy **after** submitting.
	 */
	reValidateMode?: BitwiseFlag<FormFieldReValidateMode>;
	/**
	 * Whether to notify the form field if its status has changed
	 */
	notifyOnStatusChange?: boolean;

	onInvalidSubmit?: TInvalidSubmitCallback<GFormData>;
	onValidSubmit?: TValidSubmitCallback<GFormData>;
}

export type TCreateFormConfigFormFields<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TCreateFormConfigFormField<GFormData[Key]> | TFormField<GFormData[Key]>;
};

export interface TCreateFormConfigFormField<GValue> extends Partial<TFormFieldStateConfig> {
	defaultValue?: GValue;
	validator?: TFormFieldValidator<GValue>;
}
