export interface TValidator<
	GValue,
	GValidationContext extends TBaseValidationContext<GValue> = TBaseValidationContext<GValue>
> {
	_validationChain: TValidationChain<GValue, GValidationContext>;
	validate: (cx: GValidationContext) => Promise<void>;
	append: (
		validator: TValidator<GValue, GValidationContext>
	) => TValidator<GValue, GValidationContext>;
	clone: () => TValidator<GValue, GValidationContext>;
	push: (...validateFunctions: TValidationLink<GValue, GValidationContext>[]) => void;
}

export type TValidationChain<
	GValue,
	GValidationContext extends TBaseValidationContext<GValue> = TBaseValidationContext<GValue>
> = TValidationLink<GValue, GValidationContext>[];

export interface TValidationLink<
	GValue,
	GValidationContext extends TBaseValidationContext<GValue> = TBaseValidationContext<GValue>
> {
	key: string;
	validate: TValidateCallback<GValue, GValidationContext>;
}

export type TValidateCallback<
	GValue,
	GValidationContext extends TBaseValidationContext<GValue> = TBaseValidationContext<GValue>
> = (context: GValidationContext) => Promise<void> | void;

export interface TBaseValidationContext<GValue> {
	config: TValidationContextConfig;

	value: Readonly<GValue | unknown>;
	hasError: () => boolean;
	isValue: (value: unknown) => value is GValue; // NOTE: We have to define a property using explicitly GValue to enforce generic. See: https://stackoverflow.com/questions/78716973/enforcing-same-generic-types-in-typescript/78717389
	registerError: (error: TValidationError) => void;
}

export interface TValidationError {
	[key: string]: unknown;
	code: string;
	message?: string;
	path?: string;
}

export interface TValidationContextConfig {
	name?: string;
	collectErrorMode: TCollectErrorMode;
}

export type TCollectErrorMode = 'firstError' | 'all';
