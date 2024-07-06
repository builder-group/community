import { deepCopy } from '@ibg/utils';

import { type TValidationAdapter, type TValidationChain } from './types';

export function createValidationAdapter<GValue>(
	validationChain: TValidationChain<GValue>
): TValidationAdapter<GValue> {
	return {
		_validationChain: validationChain,
		async validate(this, cx) {
			for (const validationLink of this._validationChain) {
				await validationLink.validate(cx);
				if (cx.config.collectErrorMode === 'firstError' && cx.hasError()) {
					break;
				}
			}
			return cx;
		},
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
