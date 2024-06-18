import { type TState } from 'feature-state';

import { type TCollectErrorMode, type TFormReValidateMode } from './form';

export type TFormField<GValue> = TState<GValue, ['base', 'form-field']>;

export interface TFormFieldStateFeature<GValue> {
	_config: TFormFieldStateConfig;
	_intialValue: GValue;
	_validator: TFormFieldValidator<GValue>;
	key: string;
	isValid: boolean;
	isTouched: boolean;
	status: TFormFieldStatus;
	validate: () => Promise<boolean>;
	blur: () => void;
	reset: () => void;
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
	propagate: () => void;
}

export type TFormFieldStatusValue =
	| TInvalidFormFieldStatus
	| TValidFormFieldStatus
	| TUnvalidatedFormFieldStatus;

export interface TInvalidFormFieldStatus { type: 'INVALID'; errors: TInvalidFormFieldError[] }
export interface TValidFormFieldStatus { type: 'VALID' }
export interface TUnvalidatedFormFieldStatus { type: 'UNVALIDATED' }

export interface TInvalidFormFieldError {
	type: string;
	message?: string;
}

export type TValidateFormFieldFunction<GValue> = (formField: TFormField<GValue>) => Promise<void>;
export interface TFormFieldValidationLink<GValue> {
	key: string;
	validate: TValidateFormFieldFunction<GValue>;
}
export type TFormFieldValidationChain<GValue> = TFormFieldValidationLink<GValue>[];

export interface TFormFieldValidator<GValue> {
	_validationChain: TFormFieldValidationChain<GValue>;
	isValidating: boolean;
	validate: (formField: TFormField<GValue>) => Promise<boolean>;
	append: (validator: TFormFieldValidator<GValue>) => void;
	clone: () => TFormFieldValidator<GValue>;
	push: (...validateFunctions: TFormFieldValidationLink<GValue>[]) => void;
}
