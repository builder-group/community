import { deepCopy } from '@ibg/utils';

import { type TFormFieldValidationChain, type TValidationAdapter } from './types';

export function createValidationAdapter<GValue>(
	validationChain: TFormFieldValidationChain<GValue>
): TValidationAdapter<GValue> {
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
		clone() {
			return createValidationAdapter<GValue>(deepCopy(this._validationChain));
		}
	};
}
