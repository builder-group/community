import type { TBaseValidationContext, TValidator } from 'validation-adapter';

export type TEnvData = Record<string, any>;

export type TEnvMiddleware<GValue> = (value: string | undefined) => GValue | undefined;

export type TDefaultValueFn<GValue> = (env: NodeJS.ProcessEnv) => GValue | undefined;

export type TEnvSpec<GValue> = {
	validator: TValidator<GValue, TBaseValidationContext<GValue>>;
	defaultValue?: GValue | TDefaultValueFn<GValue>;
	middlewares?: TEnvMiddleware<GValue>[];
};

export type TEnvSpecs<GEnvData extends TEnvData> = {
	[Key in keyof GEnvData]: TEnvSpec<GEnvData[Key]>;
};
