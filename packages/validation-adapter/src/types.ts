export interface TValidationAdapter<
	GValue,
	GValidateContext extends TBaseValidateContext<GValue> = TBaseValidateContext<GValue>
> {
	_validationChain: TValidationChain<GValue, GValidateContext>;
	validate: (cx: GValidateContext) => Promise<void>;
	append: (
		validator: TValidationAdapter<GValue, GValidateContext>
	) => TValidationAdapter<GValue, GValidateContext>;
	clone: () => TValidationAdapter<GValue, GValidateContext>;
	push: (...validateFunctions: TValidationLink<GValue, GValidateContext>[]) => void;
}

export type TValidationChain<
	GValue,
	GValidateContext extends TBaseValidateContext<GValue> = TBaseValidateContext<GValue>
> = TValidationLink<GValue, GValidateContext>[];

export interface TValidationLink<
	GValue,
	GValidateContext extends TBaseValidateContext<GValue> = TBaseValidateContext<GValue>
> {
	key: string;
	validate: TValidateCallback<GValue, GValidateContext>;
}

export type TValidateCallback<
	GValue,
	GValidateContext extends TBaseValidateContext<GValue> = TBaseValidateContext<GValue>
> = (context: GValidateContext) => Promise<void> | void;

export interface TBaseValidateContext<GValue> {
	config: TValidateContextConfig;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- ok here
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

export interface TValidateContextConfig {
	name?: string;
	collectErrorMode: TCollectErrorMode;
}

export type TCollectErrorMode = 'firstError' | 'all';
