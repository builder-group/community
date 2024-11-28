import { type BitwiseFlag } from '@blgc/utils';
import { type TState } from 'feature-state';
import {
	type TBaseValidationContext,
	type TCollectErrorMode,
	type TValidator
} from 'validation-adapter';

export type TFormField<GValue> = TState<GValue | undefined, ['base', 'form-field']>;

export interface TFormFieldStateFeature<GValue> {
	_config: TFormFieldStateConfig;
	_intialValue: GValue | undefined;
	_validator: TFormFieldValidator<GValue>;
	key: string;
	isTouched: boolean;
	isSubmitted: boolean;
	isSubmitting: boolean;
	isValidating: boolean;
	status: TFormFieldStatus;
	validate: () => Promise<boolean>;
	isValid: () => boolean;
	blur: () => void;
	reset: () => void;
}

export interface TFormFieldStateConfig {
	editable: boolean;
	/**
	 * Validation strategy before submitting.
	 */
	// TODO: Is BitwiseFlag to confusing for user
	validateMode: BitwiseFlag<FormFieldValidateMode>;
	/**
	 * Validation strategy after submitting.
	 */
	// TODO: Is BitwiseFlag to confusing for user
	reValidateMode: BitwiseFlag<FormFieldReValidateMode>;
	collectErrorMode: TCollectErrorMode;
}

export enum FormFieldValidateMode {
	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member -- ok here
	OnBlur = 1 << 0, // 1
	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member -- ok here
	OnChange = 1 << 1, // 2
	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member -- ok here
	OnSubmit = 1 << 2, // 4
	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member -- ok here
	OnTouched = 1 << 3 // 8
}

export enum FormFieldReValidateMode {
	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member -- ok here
	OnBlur = 1 << 0, // 1
	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member -- ok here
	OnChange = 1 << 1, // 2
	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member -- ok here
	OnSubmit = 1 << 2 // 4
}

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

export type TFormFieldValidator<GValue> = TValidator<GValue, TFormFieldValidationContext<GValue>>;

export type TFormFieldValidationContext<GValue> = TBaseValidationContext<GValue>;
