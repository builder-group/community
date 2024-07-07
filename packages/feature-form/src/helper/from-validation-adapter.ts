import { type TCreateFormConfigFormField } from '../create-form';
import { type TFormFieldValidationAdapter } from '../types';

// Helper function to make type inference work
// https://github.com/microsoft/TypeScript/issues/26242
export function fromValidationAdapter<GValue>(
	validationAdapter: TFormFieldValidationAdapter<GValue>,
	config: Omit<TCreateFormConfigFormField<GValue>, 'validationAdapter'>
): TCreateFormConfigFormField<GValue> {
	return { validationAdapter, ...config };
}
