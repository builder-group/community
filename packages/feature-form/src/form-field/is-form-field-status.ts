import { TFormFieldStatus } from '../types';

export function isFormFieldStatus(value: unknown): value is TFormFieldStatus {
	return (
		typeof value === 'object' &&
		value != null &&
		'_features' in value &&
		Array.isArray(value._features) &&
		value._features.includes('form-field-status')
	);
}
