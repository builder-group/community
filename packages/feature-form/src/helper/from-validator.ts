import { type TCreateFormConfigFormField } from '../create-form';
import { type TFormFieldValidator } from '../types';

// Helper function to make type inference work
// https://github.com/microsoft/TypeScript/issues/26242
export function fromValidator<GValue>(
	validator: TFormFieldValidator<GValue>,
	config: Omit<TCreateFormConfigFormField<GValue>, 'validator'>
): TCreateFormConfigFormField<GValue> {
	return { validator, ...config };
}
