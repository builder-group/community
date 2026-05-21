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
	type TFieldInputProps,
	type TParsedFieldInputOptions,
	type TStringFieldInputOptions
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
	...options: TControlledUseFormFieldOptionsArgs<GFormData[GKey]>
): TControlledUseFormFieldResponse<GFormData, GKey>;
export function useFormField<
	GFormData extends TFormData,
	GFeatures extends TAnyFeature[],
	GKey extends TFormFieldKey<GFormData>
>(
	form: TForm<GFormData, GFeatures>,
	key: GKey,
	...options: TUseFormFieldOptionsArgs<GFormData[GKey]>
): TUseFormFieldResponse<GFormData, GKey>;
export function useFormField<
	GFormData extends TFormData,
	GFeatures extends TAnyFeature[],
	GKey extends TFormFieldKey<GFormData>
>(
	form: TForm<GFormData, GFeatures>,
	key: GKey,
	...[options]: TAnyUseFormFieldOptionsArgs<GFormData[GKey]>
): TUseFormFieldResponse<GFormData, GKey> | TControlledUseFormFieldResponse<GFormData, GKey> {
	const controlled = options?.controlled ?? false;
	const field = form.getField(key);
	const value = useFeatureState(controlled ? field : null);
	const status = useFeatureState(field.status);

	return {
		field,
		...(controlled ? { value } : {}),
		status,
		input() {
			return getFieldInputProps<GKey, GFormData[GKey]>(
				field,
				// Note: options must be re-spread as a tuple because TypeScript cannot forward
				// conditional rest params directly; the conditional spread preserves the required/optional distinction.
				...((options == null ? [] : [options]) as TFieldInputOptionsArgs<GFormData[GKey]>)
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
	input: () => TFieldInputProps<GKey>;
}

export interface TControlledUseFormFieldResponse<
	GFormData extends TFormData,
	GKey extends TFormFieldKey<GFormData>
> extends TUseFormFieldResponse<GFormData, GKey> {
	value: GFormData[GKey];
}

export type TUseFormFieldOptionsArgs<GValue> =
	TIsWideString<GValue> extends true
		? [options?: TUseFormFieldOptions<GValue>]
		: [options: TUseFormFieldParsedOptions<GValue>];

export type TControlledUseFormFieldOptionsArgs<GValue> =
	TIsWideString<GValue> extends true
		? [options: TControlledUseFormFieldOptions<GValue>]
		: [options: TControlledUseFormFieldParsedOptions<GValue>];

type TAnyUseFormFieldOptionsArgs<GValue> =
	TIsWideString<GValue> extends true
		? [options?: TUseFormFieldOptions<GValue> | TControlledUseFormFieldOptions<GValue>]
		: [options: TUseFormFieldParsedOptions<GValue> | TControlledUseFormFieldParsedOptions<GValue>];

export interface TUseFormFieldOptions<GValue> extends Omit<
	TStringFieldInputOptions<GValue>,
	'controlled'
> {
	controlled?: false;
}

export interface TControlledUseFormFieldOptions<GValue> extends Omit<
	TStringFieldInputOptions<GValue>,
	'controlled'
> {
	controlled: true;
}

export interface TUseFormFieldParsedOptions<GValue> extends Omit<
	TParsedFieldInputOptions<GValue>,
	'controlled'
> {
	controlled?: false;
}

export interface TControlledUseFormFieldParsedOptions<GValue> extends Omit<
	TParsedFieldInputOptions<GValue>,
	'controlled'
> {
	controlled: true;
}
