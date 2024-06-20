import { createState, type TSelectFeatures } from 'feature-state';

import { type TFormFieldStatus, type TFormFieldStatusValue } from '../types';

export function createStatus(initialValue: TFormFieldStatusValue): TFormFieldStatus {
	const formFieldStatusState = createState(initialValue);

	const formFieldStatusFeature: TSelectFeatures<TFormFieldStatusValue, ['form-field-status']> = {
		registerError(this: TFormFieldStatus, error) {
			if (this._value.type === 'INVALID') {
				this._value.errors.push(error);
			} else {
				this._value = { type: 'INVALID', errors: [error] };
			}
		}
	};

	// Merge existing features from the state with the new form field status feature
	const _formFieldStatus = Object.assign(
		formFieldStatusState,
		formFieldStatusFeature
	) as unknown as TFormFieldStatus;
	_formFieldStatus._features.push('form-field-status');

	return _formFieldStatus;
}
