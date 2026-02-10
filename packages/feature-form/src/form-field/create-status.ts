import { createState } from 'feature-state';
import {
	TFormFielStatusStateFeature,
	type TFormFieldStatus,
	type TFormFieldStatusValue
} from '../types';

export function createStatus(initialValue: TFormFieldStatusValue): TFormFieldStatus {
	const baseState = createState(initialValue);

	const formFieldStatusFeature: TFormFielStatusStateFeature['api'] = {
		_nextValue: undefined,
		registerNextError(this: TFormFieldStatus, error) {
			if (this._nextValue?.type === 'INVALID') {
				this._nextValue.errors.push(error);
			} else {
				this._nextValue = { type: 'INVALID', errors: [error] };
			}
		}
	};

	// Extend the base state with the form field status feature
	const formFieldStatus = Object.assign(baseState, formFieldStatusFeature) as TFormFieldStatus;
	formFieldStatus._features.push('form-field-status');

	return formFieldStatus;
}
