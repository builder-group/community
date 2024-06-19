import { deepCopy } from '@ibg/utils';

import { type TFormFieldValidationChain, type TFormFieldValidator } from '../../types';

export function createFormFieldValidator<GValue>(
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
		},
		async validate(formField) {
			this.isValidating = true;

			for (const validationLink of this._validationChain) {
				await validationLink.validate(formField);
				if (
					formField._config.collectErrorMode === 'firstError' &&
					formField.status.get().type === 'INVALID'
				) {
					break;
				}
			}

			// If no error was registered we assume its valid
			if (formField.status.get().type === 'UNVALIDATED') {
				formField.status._value = { type: 'VALID' };
			}

			this.isValidating = false;
			return formField.status.get().type === 'VALID';
		},
		clone() {
			return createFormFieldValidator<GValue>(deepCopy(this._validationChain));
		}
	};
}
