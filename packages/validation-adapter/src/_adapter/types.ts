export interface TValidationAdapter<GValue> {
	_validationChain: TFormFieldValidationChain<GValue>;
	isValidating: boolean;
	append: (validator: TValidationAdapter<GValue>) => TValidationAdapter<GValue>;
	clone: () => TValidationAdapter<GValue>;
	push: (...validateFunctions: TFormFieldValidationLink<GValue>[]) => void;
}

export type TFormFieldValidationChain<GValue> = TFormFieldValidationLink<GValue>[];

export interface TFormFieldValidationLink<GValue> {
	key: string;
	validate: TValidateCallback<GValue>;
}

export type TValidateCallback<GValue> = (context: TValidateContext<GValue>) => Promise<void> | void;

export interface TValidateContext<GValue> {
	config: TValidateContextConfig;
	value: GValue;
	registerError: (error: TValidationError) => void;
}

export interface TValidationError {
	[key: string]: unknown;
	code: string;
	message?: string;
	path?: string;
}

export interface TValidateContextConfig {
	key: string;
	collectErrorMode: TCollectErrorMode;
}

export type TCollectErrorMode = 'firstError' | 'all';
