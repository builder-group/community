import { createState, type TSelectFeatures } from 'feature-state';

import { type TFormFieldStatus, type TFormFieldStatusValue } from '../types';

export function createFormFieldStatus(initialValue: TFormFieldStatusValue): TFormFieldStatus {
	const formFieldStatusState = createState(initialValue);

	formFieldStatusState._features.push('form-field-status');

	const formFieldStatusFeature: TSelectFeatures<TFormFieldStatusValue, ['form-field-status']> = {
		display: false,
		registerError(this: TFormFieldStatus, error) {
			if (this._value.type === 'INVALID') {
				this._value.errors.push(error);
			} else {
				this._value = { type: 'INVALID', errors: [error] };
			}
		}
	};

	// Merge existing features from the state with the new form field status feature
	return Object.assign(formFieldStatusState, formFieldStatusFeature) as unknown as TFormFieldStatus;
}
