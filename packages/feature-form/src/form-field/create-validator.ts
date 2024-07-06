import { type TFormFieldValidationAdapter, type TFormFieldValidator } from '../types';
import { createValidateContext } from './create-validate-context';

export function createValidator<GValue>(
	validationAdapter: TFormFieldValidationAdapter<GValue>
): TFormFieldValidator<GValue> {
	return {
		_validationAdapter: validationAdapter,
		isValidating: false,
		async validate(this, formField) {
			const validationContext = createValidateContext(formField);

			this.isValidating = true;
			await this._validationAdapter.validate(validationContext);
			this.isValidating = false;

			// If no error was registered we assume its valid
			if (formField.status._nextValue == null) {
				formField.status.set({ type: 'VALID' });
			} else {
				formField.status.set(formField.status._nextValue);
			}

			formField.status._nextValue = undefined;

			return formField.status.get().type === 'VALID';
		}
	};
}
