import type { StandardSchemaV1 } from '@standard-schema/spec';

/** Environment variable source read by `validateEnv()` and `validateEnvVar()`. */
export type TEnv = Record<string, unknown>;

/** Configures how a single environment value is resolved and validated. */
export interface TEnvSpec<GInput = unknown, GOutput = GInput> {
	/** Environment key to read. Defaults to the output object key. */
	envKey?: string;

	/** Standard Schema-compatible validator for the final value. */
	validator: TEnvValidator<GInput, GOutput>;

	/** Default used when the resolved value is `undefined`. */
	defaultValue?: GInput | TEnvDefaultFn<GInput>;

	/** Cleans the raw value before defaults and validation run. */
	preprocess?: TEnvPreprocess<GInput>;

	/** Extra context added to validation errors. */
	description?: string;

	/** Valid value example added to validation errors. */
	example?: string;
}

/** Standard Schema-compatible validator used by an env spec. */
export type TEnvValidator<GInput = unknown, GOutput = GInput> = StandardSchemaV1<GInput, GOutput>;

/** Cleans a raw env value before defaults and validation run. */
export type TEnvPreprocess<GValue = unknown> = (value: unknown) => GValue | undefined;

/** Computes a default value from the full env source. */
export type TEnvDefaultFn<GValue> = (env: TEnv) => GValue | undefined;

/** Env spec object accepted by `validateEnv()`, `createEnv()`, and `createViteEnvDefine()`. */
export type TEnvSpecs<GSpecs extends Record<string, unknown>> = GSpecs &
	TEnvSpecEntriesConstraint<GSpecs>;

// Note: Keep defaultValue and preprocess tied to the validator input type
// without widening validateEnv inference
type TEnvSpecEntriesConstraint<GSpecs extends Record<string, unknown>> = {
	[Key in keyof GSpecs]: TEnvSpecEntryConstraint<GSpecs[Key]>;
};

type TEnvSpecEntryConstraint<GSpecEntry> = GSpecEntry extends { validator: infer GValidator }
	? GValidator extends TEnvValidator<infer GInput, infer GOutput>
		? TEnvSpec<GInput, GOutput>
		: never
	: GSpecEntry extends TEnvValidator<infer GInput, infer GOutput>
		? TEnvValidator<GInput, GOutput>
		: GSpecEntry;

/** Validated env object returned from a spec object. */
export type TEnvData<GSpecs extends Record<string, unknown>> = {
	[Key in keyof GSpecs]: TEnvSpecEntryOutput<GSpecs[Key]>;
};

type TEnvSpecEntryOutput<GSpecEntry> =
	GSpecEntry extends TEnvSpec<infer _GInput, infer GOutput>
		? GOutput
		: GSpecEntry extends TEnvValidator<infer _GInput, infer GOutput>
			? GOutput
			: GSpecEntry;
