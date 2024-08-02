import { deepCopy } from '@blgc/utils';

import { type TValidationChain, type TValidator } from './types';

export function createValidator<GValue>(
	validationChain: TValidationChain<GValue>
): TValidator<GValue> {
	return {
		_validationChain: validationChain,
		async validate(this, cx) {
			for (const validationLink of this._validationChain) {
				await validationLink.validate(cx);
				if (cx.config.collectErrorMode === 'firstError' && cx.hasError()) {
					break;
				}
			}
		},
		push(validateFunctions) {
			this._validationChain.push(validateFunctions);
		},
		append(validator) {
			this._validationChain.push(...validator._validationChain);
			return this;
		},
		clone() {
			return createValidator<GValue>(deepCopy(this._validationChain));
		}
	};
}
