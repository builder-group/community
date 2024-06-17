import { TState } from 'feature-state';

import { TCollectErrorMode, TFormReValidateMode } from './form';

export type TFormField<GValue> = TState<GValue, ['base', 'form-field']>;

export interface TFormFieldStateFeature<GValue> {
	_config: TFormFieldStateConfig;
	_intialValue: GValue;
	key: string;
	isTouched: boolean;
	status: TFormFieldStatus;
	validator: TFormFieldValidator<GValue>;
	validate: () => Promise<boolean>;
	blur: () => void;
	reset: () => void;
	propagateStatus: () => void;
}

export interface TFormFieldStateConfig {
	editable: boolean;
	reValidateMode: TFormReValidateMode;
	collectErrorMode: TCollectErrorMode;
}

export type TFormFieldStatus = TState<TFormFieldStatusValue, ['base', 'form-field-status']>;

export interface TFormFielStatusStateFeature {
	display: boolean;
	registerError: (error: TInvalidFormFieldError) => void;
}

export type TFormFieldStatusValue =
	| TInvalidFormFieldStatus
	| TValidFormFieldStatus
	| TUnvalidatedFormFieldStatus;

export type TInvalidFormFieldStatus = { type: 'INVALID'; errors: TInvalidFormFieldError[] };
export type TValidFormFieldStatus = { type: 'VALID' };
export type TUnvalidatedFormFieldStatus = { type: 'UNVALIDATED' };

export interface TInvalidFormFieldError {
	type: string;
	message?: string;
}

export type TValidateFormFieldFunction<GValue> = (
	value: GValue,
	formFieldStatus: TFormFieldStatus
) => Promise<void>;
export type TFormFieldValidationChain<GValue> = TValidateFormFieldFunction<GValue>[];

export interface TFormFieldValidator<GValue> {
	_validationChain: TFormFieldValidationChain<GValue>;
	isValidating: boolean;
	validate: (formField: TFormField<GValue>) => Promise<boolean>;
	append: (validator: TFormFieldValidator<GValue>) => void;
	clone: () => TFormFieldValidator<GValue>;
}
