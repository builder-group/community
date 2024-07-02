import { deepCopy } from '@ibg/utils';

import { type TFormFieldValidationChain, type TFormFieldValidator } from '../../types';

export function createValidator<GValue>(
	validationChain: TFormFieldValidationChain<GValue>
): TFormFieldValidator<GValue> {
	return {
		_validationChain: validationChain,
		isValidating: false,
		push(validateFunctions) {
			this._validationChain.push(validateFunctions);
		},
		append(validator) {
			this._validationChain.push(...validator._validationChain);
			return this;
		},
		async validate(formField) {
			this.isValidating = true;

			for (const validationLink of this._validationChain) {
				await validationLink.validate(formField);
				if (
					formField._config.collectErrorMode === 'firstError' &&
					formField.status._nextValue?.type === 'INVALID'
				) {
					break;
				}
			}

			// If no error was registered we assume its valid
			if (formField.status._nextValue == null) {
				formField.status.set({ type: 'VALID' });
			} else {
				formField.status.set(formField.status._nextValue);
			}

			formField.status._nextValue = undefined;
			this.isValidating = false;

			return formField.status.get().type === 'VALID';
		},
		clone() {
			return createValidator<GValue>(deepCopy(this._validationChain));
		}
	};
}
