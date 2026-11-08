import type { StandardSchemaV1 } from '@standard-schema/spec';
import { Err, Ok, type TResult } from 'tuple-result';
import { VersjonError } from '../error';
import { isJsonObject } from '../json';
import type {
	TRegisteredSchemaValue,
	TSchemaDefinition,
	TSchemaMigration,
	TSchemaValue
} from './definition';
import {
	formatSchemaReference,
	readSchemaReference,
	type TSchemaReferenceParts
} from './reference';
import { validateSchemaValue, type TValidatedSchemaValue } from './validate';

/**
 * Validates a persisted value and migrates it one version at a time to the current definition.
 * Returns a detached value without changing the caller's input.
 */
export function prepareSchemaValue<GDefinition extends TSchemaDefinition>(
	definition: GDefinition,
	input: unknown
): TResult<TValidatedSchemaValue<TSchemaValue<GDefinition>>, VersjonError> {
	if (!isJsonObject(input)) {
		return Err(
			new VersjonError('#ERR_SCHEMA_VALUE', {
				message: 'Schema value must be a JSON object'
			})
		);
	}

	const [isInputReferenceOk, inputReferenceErr, inputReference] = readSchemaReference(input);
	if (!isInputReferenceOk) {
		return Err(inputReferenceErr);
	}
	if (inputReference.family !== definition.family) {
		return Err(
			new VersjonError('#ERR_SCHEMA_REFERENCE', {
				message: `Expected schema family ${definition.family}, received ${inputReference.family}`
			})
		);
	}
	if (inputReference.version > definition.version) {
		return Err(
			new VersjonError('#ERR_SCHEMA_REFERENCE', {
				message: `Unsupported newer schema ${formatSchemaReference(inputReference)}`
			})
		);
	}

	const [isInputSchemaOk, inputSchemaErr, inputSchema] = getSchemaForVersion(
		definition,
		inputReference
	);
	if (!isInputSchemaOk) {
		return Err(inputSchemaErr);
	}

	const [isInputValueOk, inputValueErr, inputValue] = validateSchemaValue(
		{ ...inputReference, schema: inputSchema },
		input
	);
	if (!isInputValueOk) {
		return Err(inputValueErr);
	}

	let currentValue = inputValue;
	for (let version = inputReference.version; version < definition.version; version += 1) {
		const sourceReference: TSchemaReferenceParts = {
			family: inputReference.family,
			version
		};
		const [isMigrationOk, migrationErr, migration] = getMigrationForVersion(
			definition,
			sourceReference
		);
		if (!isMigrationOk) {
			return Err(migrationErr);
		}

		let migrationOutput: unknown;
		try {
			migrationOutput = migration.migrate(currentValue);
		} catch (cause) {
			return Err(
				new VersjonError('#ERR_SCHEMA_MIGRATION', {
					message: `Migration failed for ${formatSchemaReference(sourceReference)}`,
					cause
				})
			);
		}
		const [isMigrationOutputOk, migrationOutputErr, nextValue] = validateMigrationOutput(
			definition,
			migrationOutput,
			sourceReference
		);
		if (!isMigrationOutputOk) {
			return Err(migrationOutputErr);
		}

		currentValue = nextValue;
	}

	return Ok(currentValue as TValidatedSchemaValue<TSchemaValue<GDefinition>>);
}

function getSchemaForVersion(
	definition: TSchemaDefinition,
	reference: TSchemaReferenceParts
): TResult<StandardSchemaV1<unknown, TRegisteredSchemaValue>, VersjonError> {
	if (reference.version === definition.version) {
		return Ok(definition.schema);
	}

	const [isMigrationOk, migrationErr, migration] = getMigrationForVersion(definition, reference);
	if (!isMigrationOk) {
		return Err(migrationErr);
	}

	return Ok(migration.schema);
}

function getMigrationForVersion(
	definition: TSchemaDefinition,
	reference: TSchemaReferenceParts
): TResult<TSchemaMigration, VersjonError> {
	const migration = definition.migrations?.[reference.version];
	if (migration == null) {
		return Err(
			new VersjonError('#ERR_SCHEMA_MIGRATION', {
				message: `Missing migration for ${formatSchemaReference(reference)}`
			})
		);
	}

	return Ok(migration);
}

function validateMigrationOutput(
	definition: TSchemaDefinition,
	migrationOutput: unknown,
	sourceReference: TSchemaReferenceParts
): TResult<TValidatedSchemaValue, VersjonError> {
	if (!isJsonObject(migrationOutput)) {
		return Err(
			new VersjonError('#ERR_SCHEMA_MIGRATION', {
				message: `Migration produced a non-JSON value for ${formatSchemaReference(sourceReference)}`
			})
		);
	}

	const [isOutputReferenceOk, outputReferenceErr, outputReference] =
		readSchemaReference(migrationOutput);
	if (!isOutputReferenceOk) {
		return Err(
			new VersjonError('#ERR_SCHEMA_MIGRATION', {
				message: `Migration produced an invalid schema reference for ${formatSchemaReference(sourceReference)}`,
				cause: outputReferenceErr
			})
		);
	}

	const expectedReference: TSchemaReferenceParts = {
		family: sourceReference.family,
		version: sourceReference.version + 1
	};
	if (
		outputReference.family !== expectedReference.family ||
		outputReference.version !== expectedReference.version
	) {
		return Err(
			new VersjonError('#ERR_SCHEMA_MIGRATION', {
				message: `Migration for ${formatSchemaReference(sourceReference)} must produce ${formatSchemaReference(expectedReference)}`
			})
		);
	}

	const [isExpectedSchemaOk, expectedSchemaErr, expectedSchema] = getSchemaForVersion(
		definition,
		expectedReference
	);
	if (!isExpectedSchemaOk) {
		return Err(expectedSchemaErr);
	}

	const [isOutputValueOk, outputValueErr, outputValue] = validateSchemaValue(
		{ ...expectedReference, schema: expectedSchema },
		migrationOutput
	);
	if (!isOutputValueOk) {
		return Err(
			new VersjonError('#ERR_SCHEMA_MIGRATION', {
				message: `Migration produced an invalid value for ${formatSchemaReference(expectedReference)}`,
				cause: outputValueErr
			})
		);
	}

	return Ok(outputValue);
}
