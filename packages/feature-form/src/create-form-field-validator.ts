import { deepCopy } from '@ibg/utils';

import { TFormFieldValidationChain, TFormFieldValidator } from './types';

export function createFormFieldValidator<GValue>(
	validationChain: TFormFieldValidationChain<GValue>
): TFormFieldValidator<GValue> {
	return {
		_validationChain: validationChain,
		isValidating: false,
		append(validator) {
			this._validationChain.push(...validator._validationChain);
		},
		async validate(formField) {
			this.isValidating = true;
			for (const validateFunction of this._validationChain) {
				await validateFunction(formField.get(), formField.status);
				if (
					formField._config.collectErrorMode === 'firstError' &&
					formField.status.get().type === 'INVALID'
				) {
					break;
				}
			}
			this.isValidating = false;
			return formField.status.get().type === 'VALID';
		},
		clone() {
			return createFormFieldValidator<GValue>(deepCopy(this._validationChain));
		}
	};
}
