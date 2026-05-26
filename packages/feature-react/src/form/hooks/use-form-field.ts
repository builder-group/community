import { type TAnyFeature } from 'feature-core';
import {
	type TForm,
	type TFormData,
	type TFormField,
	type TFormFieldKey,
	type TValidationStatusValue
} from 'feature-form';
// Note: Import the hook file directly so the form entry does not pull in the state feature barrel
import { useFeatureState } from '../../state/hooks/use-feature-state';
import {
	getFieldInputProps,
	type TFieldInputOptionsArgs,
	type TFieldInputProps
} from '../get-field-input-props';
import { type TIsWideString } from '../types';

/**
 * Subscribes to a form field's status and re-renders when it changes. Uncontrolled by
 * default: only re-renders on status changes, not on every keystroke. Pass
 * `{ controlled: true }` to also subscribe to the field value and re-render on change.
 *
 * Returns `field` (the `TFormField` instance), `status` (the current validation status),
 * and `input()` (ready-to-spread input props). Pass `controlled` to this hook, and pass
 * `format` and `parse` to the returned `input()` helper.
 */
export function useFormField<
	GFormData extends TFormData,
	GFeatures extends TAnyFeature[],
	GKey extends TFormFieldKey<GFormData>
>(
	form: TForm<GFormData, GFeatures>,
	key: GKey,
	options: TControlledUseFormFieldOptions
): TControlledUseFormFieldResponse<GFormData, GKey>;
export function useFormField<
	GFormData extends TFormData,
	GFeatures extends TAnyFeature[],
	GKey extends TFormFieldKey<GFormData>
>(
	form: TForm<GFormData, GFeatures>,
	key: GKey,
	options?: TUseFormFieldOptions
): TUseFormFieldResponse<GFormData, GKey>;
export function useFormField<
	GFormData extends TFormData,
	GFeatures extends TAnyFeature[],
	GKey extends TFormFieldKey<GFormData>
>(
	form: TForm<GFormData, GFeatures>,
	key: GKey,
	options?: TUseFormFieldOptions | TControlledUseFormFieldOptions
): TUseFormFieldResponse<GFormData, GKey> | TControlledUseFormFieldResponse<GFormData, GKey> {
	const controlled = options?.controlled ?? false;
	const field = form.getField(key);
	const value = useFeatureState(controlled ? field : null);
	const status = useFeatureState(field.status);

	return {
		field,
		...(controlled ? { value } : {}),
		status,
		input(...[inputOptions]: TUseFormFieldInputOptionsArgs<GFormData[GKey]>) {
			return getFieldInputProps<GKey, GFormData[GKey]>(
				field,
				// Note: Input options must be re-spread as a tuple because TypeScript cannot forward
				// conditional rest params directly; the conditional spread preserves the required/optional distinction.
				...((controlled || inputOptions != null
					? [{ ...inputOptions, controlled }]
					: []) as TFieldInputOptionsArgs<GFormData[GKey]>)
			);
		}
	};
}

export interface TUseFormFieldResponse<
	GFormData extends TFormData,
	GKey extends TFormFieldKey<GFormData>
> {
	/** The raw `TFormField` instance for the subscribed field. */
	field: TFormField<GFormData[GKey]>;
	/** Current validation status value. */
	status: TValidationStatusValue;
	/** Returns ready-to-spread input props. Pass `format` and `parse` here for non-string fields. */
	input: (...options: TUseFormFieldInputOptionsArgs<GFormData[GKey]>) => TFieldInputProps<GKey>;
}

/** Requires `format` and `parse` for non-string field values. */
export type TUseFormFieldInputOptionsArgs<GValue> =
	TIsWideString<GValue> extends true
		? [options?: TUseFormFieldInputOptions<GValue>]
		: [options: TUseFormFieldParsedInputOptions<GValue>];

export interface TUseFormFieldInputOptions<GValue> {
	/** Converts the field value to a display string. */
	format?: (value: GValue) => string | undefined;
	/** Converts the input string back to the field value type. */
	parse?: (value: string) => GValue;
}

export interface TUseFormFieldParsedInputOptions<GValue> {
	/** Converts the field value to a display string. */
	format: (value: GValue) => string | undefined;
	/** Converts the input string back to the field value type. */
	parse: (value: string) => GValue;
}

export interface TControlledUseFormFieldResponse<
	GFormData extends TFormData,
	GKey extends TFormFieldKey<GFormData>
> extends TUseFormFieldResponse<GFormData, GKey> {
	/** Current field value. Only present when `controlled: true` is passed. */
	value: GFormData[GKey];
}

export interface TUseFormFieldOptions {
	/** `false` (default). Subscribes to status changes only; does not re-render on every keystroke. */
	controlled?: false;
}

export interface TControlledUseFormFieldOptions {
	/** Subscribes to both value and status changes. Re-renders on every keystroke. */
	controlled: true;
}
