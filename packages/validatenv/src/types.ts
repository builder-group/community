import type { TBaseValidationContext, TValidator } from 'validation-adapter';

export type TEnvData = Record<string, any>;

export type TEnvMiddleware<GValue> = (value: string | undefined) => GValue | undefined;

export type TDefaultValueFn<GValue> = (env: NodeJS.ProcessEnv) => GValue | undefined;

export type TEnvSpec<GValue> = {
	/**
	 * Optional custom environment variable key to look up in process.env
	 * If not provided, the object property name will be used
	 * @example
	 * ```ts
	 * // Will look for process.env.DATABASE_URL instead of process.env.dbUrl
	 * dbUrl: {
	 *   envKey: 'DATABASE_URL',
	 * }
	 * ```
	 */
	envKey?: string;

	/** The validator function to validate the environment variable */
	validator: TValidator<GValue, TBaseValidationContext<GValue>>;

	/**
	 * Optional default value or function to generate default value
	 * @example
	 * ```ts
	 * // Static default value
	 * defaultValue: 3000
	 *
	 * // Function that returns default based on other env vars
	 * defaultValue: (env) => env.NODE_ENV === 'development' ? 3000 : 8080
	 * ```
	 */
	defaultValue?: GValue | TDefaultValueFn<GValue>;

	/**
	 * Optional array of middleware functions to transform the value
	 * @example
	 * ```ts
	 * middlewares: [
	 *   (value) => value?.toLowerCase(),
	 *   (value) => value === 'true' ? true : false
	 * ]
	 * ```
	 */
	middlewares?: TEnvMiddleware<GValue>[];

	/**
	 * Optional description of the environment variable
	 * Used in error messages to provide more context
	 * @example "The port number for the server to listen on"
	 */
	description?: string;

	/**
	 * Optional example of valid values
	 * Used in error messages to help users fix invalid values
	 * @example "3000, 8080, etc."
	 */
	example?: string;
};

export type TEnvSpecs<GEnvData extends TEnvData> = {
	[Key in keyof GEnvData]: TEnvSpec<GEnvData[Key]>;
};
