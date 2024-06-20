import { type TState } from 'feature-state';

import { type TCollectErrorMode } from './form';

export type TFormField<GValue> = TState<GValue | undefined, ['base', 'form-field']>;

export interface TFormFieldStateFeature<GValue> {
	_config: TFormFieldStateConfig;
	_intialValue: GValue | undefined;
	_validator: TFormFieldValidator<GValue>;
	key: string;
	isValid: boolean;
	isTouched: boolean;
	isSubmitted: boolean;
	status: TFormFieldStatus;
	validate: () => Promise<boolean>;
	blur: () => void;
	reset: () => void;
}

export interface TFormFieldStateConfig {
	editable: boolean;
	/**
	 * Validation strategy before submitting.
	 */
	validateMode: TFormFieldValidateMode;
	/**
	 * Validation strategy after submitting.
	 */
	reValidateMode: TFormFieldReValidateMode;
	collectErrorMode: TCollectErrorMode;
}

export type TFormFieldValidateMode = 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched';

export type TFormFieldReValidateMode = 'onBlur' | 'onChange' | 'onSubmit';

export type TFormFieldStatus = TState<TFormFieldStatusValue, ['base', 'form-field-status']>;

export interface TFormFielStatusStateFeature {
	_nextValue?: TFormFieldStatusValue;
	registerNextError: (error: TInvalidFormFieldError) => void;
}

export type TFormFieldStatusValue =
	| TInvalidFormFieldStatus
	| TValidFormFieldStatus
	| TUnvalidatedFormFieldStatus;

export interface TInvalidFormFieldStatus {
	type: 'INVALID';
	errors: TInvalidFormFieldError[];
}
export interface TValidFormFieldStatus {
	type: 'VALID';
}
export interface TUnvalidatedFormFieldStatus {
	type: 'UNVALIDATED';
}

export interface TInvalidFormFieldError {
	code: string;
	message?: string;
	path?: string;
}

export type TValidateFormFieldFunction<GValue> = (
	formField: TFormField<GValue>
) => Promise<void> | void;
export interface TFormFieldValidationLink<GValue> {
	key: string;
	validate: TValidateFormFieldFunction<GValue>;
}
export type TFormFieldValidationChain<GValue> = TFormFieldValidationLink<GValue>[];

export interface TFormFieldValidator<GValue> {
	_validationChain: TFormFieldValidationChain<GValue>;
	isValidating: boolean;
	validate: (formField: TFormField<GValue>) => Promise<boolean>;
	append: (validator: TFormFieldValidator<GValue>) => TFormFieldValidator<GValue>;
	clone: () => TFormFieldValidator<GValue>;
	push: (...validateFunctions: TFormFieldValidationLink<GValue>[]) => void;
}
