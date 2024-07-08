import { type TFormField, type TFormFieldValidateContext } from '../types';

export function createValidateContext<GValue>(
	formField: TFormField<GValue>
): TFormFieldValidateContext<GValue> {
	return {
		config: {
			collectErrorMode: formField._config.collectErrorMode,
			name: formField.key
		},
		value: formField.get() as Readonly<GValue>,
		isValue: (v): v is GValue => {
			return true;
		},
		hasError: () => {
			return formField.status._nextValue?.type === 'INVALID';
		},
		registerError(this, error) {
			formField.status.registerNextError({
				code: error.code,
				message: error.message,
				path: error.path
			});
		}
	};
}
