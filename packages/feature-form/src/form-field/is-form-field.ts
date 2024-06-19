import { type TFormField } from '../types';

export function isFormField<GValue = unknown>(value: unknown): value is TFormField<GValue> {
	return (
		typeof value === 'object' &&
		value != null &&
		'_features' in value &&
		Array.isArray(value._features) &&
		value._features.includes('form-field')
	);
}
