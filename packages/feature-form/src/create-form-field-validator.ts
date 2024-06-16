import { deepCopy } from '@ibg/utils';

import { TFormFieldValidator, TValidateFormField, TValidateFormFieldLink } from './types';

export function createFormFieldValidator<GValue>(
	chain: TValidateFormFieldLink<GValue>[]
): TFormFieldValidator<GValue> {
	return {
		_chain: chain,
		isValidating: false,
		append(validator) {
			this._chain.push(...validator._chain);
		},
		async validate(formField) {
			this.isValidating = true;
			await this._chain.reduceRight<TValidateFormField<GValue>>(
				(acc, link) => link(acc),
				async () => {}
			)(formField);
			this.isValidating = false;
			return formField.status.get().type === 'VALID';
		},
		clone() {
			return createFormFieldValidator<GValue>(deepCopy(this._chain));
		}
	};
}
