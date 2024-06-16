import { TState } from 'feature-state';

export type TFormField<GValue> = TState<GValue, ['base', 'form-field']>;

export interface TFormFieldStateFeature<GValue> {
	_config: TFormFieldStateConfig;
	isTouched: boolean;
	status: TFormFieldStatus;
	validator: TFormFieldValidator<GValue>;
	blur: () => void;
	reset: () => void;
}

export interface TFormFieldStateConfig {
	key: string;
	editable: boolean;
}

export type TFormFieldStatus = TState<TFormFieldStatusValue, ['base', 'form-field-status']>;

export interface TFormFielStatusStateFeature {
	display: boolean;
}

export type TFormFieldStatusValue =
	| TInvalidFormFieldStatus
	| TValidFormFieldStatus
	| TUnkownFormFieldStatus;

export type TInvalidFormFieldStatus = { type: 'INVALID'; message?: string };
export type TValidFormFieldStatus = { type: 'VALID'; message?: string };
export type TUnkownFormFieldStatus = { type: 'UNKOWN' };

export type TValidateFormField<GValue> = (formField: TFormField<GValue>) => Promise<void>;

export type TValidateFormFieldLink<GValue> = (
	next: TValidateFormField<GValue>
) => TValidateFormField<GValue>;

export interface TFormFieldValidator<GValue> {
	_chain: TValidateFormFieldLink<GValue>[];
	isValidating: boolean;
	validate: (formField: TFormField<GValue>) => Promise<boolean>;
	append: (validator: TFormFieldValidator<GValue>) => void;
	clone: () => TFormFieldValidator<GValue>;
}
