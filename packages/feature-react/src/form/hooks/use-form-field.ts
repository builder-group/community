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
 * Subscribes to one form field's status and returns its field API and input props helper.
 * Pass `{ controlled: true }` to also subscribe to the field value.
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
	field: TFormField<GFormData[GKey]>;
	status: TValidationStatusValue;
	input: (...options: TUseFormFieldInputOptionsArgs<GFormData[GKey]>) => TFieldInputProps<GKey>;
}

export type TUseFormFieldInputOptionsArgs<GValue> =
	TIsWideString<GValue> extends true
		? [options?: TUseFormFieldInputOptions<GValue>]
		: [options: TUseFormFieldParsedInputOptions<GValue>];

export interface TUseFormFieldInputOptions<GValue> {
	format?: (value: GValue) => string | undefined;
	parse?: (value: string) => GValue;
}

export interface TUseFormFieldParsedInputOptions<GValue> {
	format: (value: GValue) => string | undefined;
	parse: (value: string) => GValue;
}

export interface TControlledUseFormFieldResponse<
	GFormData extends TFormData,
	GKey extends TFormFieldKey<GFormData>
> extends TUseFormFieldResponse<GFormData, GKey> {
	value: GFormData[GKey];
}

export interface TUseFormFieldOptions {
	controlled?: false;
}

export interface TControlledUseFormFieldOptions {
	controlled: true;
}
