export interface TValidationAdapter<
	GValue,
	GValidateContext extends TBaseValidateContext<GValue> = TBaseValidateContext<GValue>
> {
	_validationChain: TValidationChain<GValue, GValidateContext>;
	validate: <GInnerValidateContext extends GValidateContext = GValidateContext>(
		cx: GInnerValidateContext
	) => Promise<GInnerValidateContext>;
	append: (validator: TValidationAdapter<GValue>) => TValidationAdapter<GValue>;
	clone: () => TValidationAdapter<GValue>;
	push: (...validateFunctions: TValidationLink<GValue>[]) => void;
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
	value: Readonly<GValue> | unknown;
	hasError: () => boolean;
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
