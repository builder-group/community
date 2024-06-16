import { createState, TSelectFeatures } from 'feature-state';

import { TFormFieldStatus, TFormFieldStatusValue } from './types';

export function createFormFieldStatus(initialValue: TFormFieldStatusValue): TFormFieldStatus {
	const formFieldStatusState = createState(initialValue);

	formFieldStatusState._features.push('form-field-status');

	const formFieldStatusFeature: TSelectFeatures<TFormFieldStatusValue, ['form-field-status']> = {
		display: false
	};

	// Merge existing features from the state with the new undo feature
	const _formFieldStatusState = Object.assign(formFieldStatusState, formFieldStatusFeature);

	return _formFieldStatusState as TFormFieldStatus;
}
