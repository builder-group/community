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

/**
 * Subscribes to one form field and returns its field API, value, status, and input props helper.
 */
export function useFormField<
	GFormData extends TFormData,
	GFeatures extends TAnyFeature[],
	GKey extends TFormFieldKey<GFormData>
>(form: TForm<GFormData, GFeatures>, key: GKey): TUseFormFieldResponse<GFormData, GKey> {
	const field = form.getField(key);
	const value = useFeatureState(field);
	const status = useFeatureState(field.status);

	return {
		field,
		value,
		status,
		input(...[options]: TFieldInputOptionsArgs<GFormData[GKey]>) {
			return getFieldInputProps<GKey, GFormData[GKey]>(
				field,
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
	value: GFormData[GKey];
	status: TValidationStatusValue;
	input: (...options: TFieldInputOptionsArgs<GFormData[GKey]>) => TFieldInputProps<GKey>;
}
