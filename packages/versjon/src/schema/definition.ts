import type { StandardSchemaV1 } from '@standard-schema/spec';
import { Err, Ok, type TResult } from 'tuple-result';
import { VersjonError } from '../error';

/**
 * Defines a schema family with its current Standard Schema validator and migrations.
 * The validator's output type must use `<family>@<version>` as its `$schema` reference.
 * Throws `VersjonError` for an invalid family, version, or migration chain.
 */
export function defineSchema<
	const GFamily extends string,
	const GVersion extends number,
	GSchema extends StandardSchemaV1<unknown, TRegisteredSchemaValue<`${GFamily}@${GVersion}`>>,
	const GMigrations extends TSchemaMigrations = never
>(
	definition: TSchemaDefinition<GFamily, GVersion, GSchema, GMigrations>
): TSchemaDefinition<GFamily, GVersion, GSchema, GMigrations> {
	validateSchemaDefinition(definition).unwrap();
	return definition;
}

/** Checks a definition's family, version and migration chain. */
export function validateSchemaDefinition(
	definition: TSchemaDefinition
): TResult<void, VersjonError> {
	const isValidFamily =
		typeof definition.family === 'string' &&
		definition.family.length > 0 &&
		!definition.family.includes('@');
	if (!isValidFamily) {
		return Err(
			new VersjonError('#ERR_SCHEMA_DEFINITION', {
				message: `Invalid schema family ${JSON.stringify(definition.family)}`
			})
		);
	}

	const isValidVersion = Number.isSafeInteger(definition.version) && definition.version > 0;
	if (!isValidVersion) {
		return Err(
			new VersjonError('#ERR_SCHEMA_DEFINITION', {
				message: `Invalid schema version ${String(definition.version)}`
			})
		);
	}

	// Note: Migration keys must be canonical integers because runtime lookup uses numeric versions
	const migrationVersions: number[] = [];
	for (const migrationKey of Object.keys(definition.migrations ?? {})) {
		const migrationVersion = Number(migrationKey);
		const isValidMigrationVersion =
			/^[1-9]\d*$/.test(migrationKey) &&
			Number.isSafeInteger(migrationVersion) &&
			migrationVersion < definition.version;
		if (!isValidMigrationVersion) {
			return Err(
				new VersjonError('#ERR_SCHEMA_DEFINITION', {
					message: `Invalid migration version ${migrationKey} for ${definition.family}@${definition.version}`
				})
			);
		}
		migrationVersions.push(migrationVersion);
	}

	migrationVersions.sort((left, right) => left - right);
	const [firstMigrationVersion] = migrationVersions;
	if (firstMigrationVersion == null) {
		return Ok(undefined);
	}

	let expectedVersion = firstMigrationVersion;
	for (const migrationVersion of migrationVersions) {
		if (migrationVersion !== expectedVersion) {
			return Err(
				new VersjonError('#ERR_SCHEMA_DEFINITION', {
					message: `Missing migration version ${expectedVersion} for ${definition.family}@${definition.version}`
				})
			);
		}
		expectedVersion += 1;
	}

	if (expectedVersion !== definition.version) {
		return Err(
			new VersjonError('#ERR_SCHEMA_DEFINITION', {
				message: `Missing migration version ${expectedVersion} for ${definition.family}@${definition.version}`
			})
		);
	}

	return Ok(undefined);
}

/** Defines a migration while preserving its input schema and output type inference. */
export function defineMigration<
	GSchema extends StandardSchemaV1<unknown, TRegisteredSchemaValue>,
	GOutput extends TRegisteredSchemaValue
>(migration: TSchemaMigration<GSchema, GOutput>): TSchemaMigration<GSchema, GOutput> {
	return migration;
}

/** Defines the current validator and supported migrations for one schema family. */
export interface TSchemaDefinition<
	GFamily extends string = string,
	GVersion extends number = number,
	GSchema extends StandardSchemaV1<unknown, TRegisteredSchemaValue<`${GFamily}@${GVersion}`>> =
		StandardSchemaV1<unknown, TRegisteredSchemaValue<`${GFamily}@${GVersion}`>>,
	GMigrations extends TSchemaMigrations = TSchemaMigrations
> {
	/** Nonempty family name without `@`. */
	readonly family: GFamily;
	/** Positive safe integer for the current version. */
	readonly version: GVersion;
	/** Standard Schema validator whose successful output must equal its input value. */
	readonly schema: GSchema;
	/** Migrations keyed by the version they read. */
	readonly migrations?: GMigrations;
}

/** Maps each supported source version to its migration into the next version. */
export type TSchemaMigrations = Readonly<Record<number, TSchemaMigration>>;

export interface TSchemaMigration<
	GSchema extends StandardSchemaV1<unknown, TRegisteredSchemaValue> = StandardSchemaV1<
		unknown,
		TRegisteredSchemaValue
	>,
	GOutput extends TRegisteredSchemaValue = TRegisteredSchemaValue
> {
	/** Source version validator whose successful output must equal its input value. */
	readonly schema: GSchema;
	/** Produces the next version from a validated source value. */
	migrate(value: StandardSchemaV1.InferOutput<GSchema>): GOutput;
}

export interface TRegisteredSchemaValue<GReference extends string = string> {
	$schema: GReference;
}

/** Infers the current value type from a schema definition. */
export type TSchemaValue<GDefinition extends TSchemaDefinition> = StandardSchemaV1.InferOutput<
	GDefinition['schema']
>;
