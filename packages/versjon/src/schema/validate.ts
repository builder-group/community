import type { StandardSchemaV1 } from '@standard-schema/spec';
import { Err, Ok, type TResult } from 'tuple-result';
import { VersjonError } from '../error';
import { areJsonValuesEqual, cloneJson, isJsonObject, type TJsonObject } from '../json';
import type { TRegisteredSchemaValue, TSchemaDefinition } from './definition';
import { formatSchemaReference } from './reference';

/**
 * Validates a value against a schema definition without running migrations.
 * Accepts a full definition or its family, version and schema fields for one version.
 * Requires `$schema` to match and returns a detached copy of unchanged JSON output.
 */
export function validateSchemaValue<
	GDefinition extends
		| TSchemaDefinition
		| {
				readonly family: string;
				readonly version: number;
				readonly schema: StandardSchemaV1<unknown, TRegisteredSchemaValue>;
		  }
>(
	definition: GDefinition,
	input: unknown
): TResult<
	TValidatedSchemaValue<StandardSchemaV1.InferOutput<GDefinition['schema']>>,
	VersjonError
> {
	if (!isJsonObject(input)) {
		return Err(
			new VersjonError('#ERR_SCHEMA_VALUE', {
				message: 'Schema value must be a JSON object'
			})
		);
	}

	const reference = formatSchemaReference(definition);
	if (input['$schema'] !== reference) {
		return Err(
			new VersjonError('#ERR_SCHEMA_REFERENCE', {
				message: `Expected schema ${reference}, received ${String(input['$schema'])}`
			})
		);
	}

	const validatorInput = cloneJson(input);
	let validationResult:
		| StandardSchemaV1.Result<StandardSchemaV1.InferOutput<GDefinition['schema']>>
		| Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<GDefinition['schema']>>>;
	try {
		validationResult = definition.schema['~standard'].validate(validatorInput);
	} catch (cause) {
		return Err(
			new VersjonError('#ERR_SCHEMA_VALUE', {
				message: `Schema validation failed for ${reference}`,
				cause
			})
		);
	}

	if (isPromiseLike(validationResult)) {
		// Note: Consume rejected async validations after reporting the unsupported result
		void Promise.resolve(validationResult).catch(() => undefined);
		return Err(
			new VersjonError('#ERR_SCHEMA_VALUE', {
				message: `Schema ${reference} returned an asynchronous validation result`
			})
		);
	}

	if (validationResult.issues != null) {
		return Err(
			new VersjonError('#ERR_SCHEMA_VALUE', {
				message: `Invalid schema value for ${reference}`,
				cause: validationResult.issues
			})
		);
	}

	if (!isJsonObject(validationResult.value)) {
		return Err(
			new VersjonError('#ERR_SCHEMA_VALUE', {
				message: `Schema ${reference} produced a non-JSON value`
			})
		);
	}

	if (!areJsonValuesEqual(input, validationResult.value)) {
		return Err(
			new VersjonError('#ERR_SCHEMA_VALUE', {
				message: `Schema ${reference} normalized its value`
			})
		);
	}

	return Ok(cloneJson(validationResult.value));
}

/** Preserves the Standard Schema output type for a validated JSON object. */
export type TValidatedSchemaValue<GValue extends TRegisteredSchemaValue = TRegisteredSchemaValue> =
	GValue & TJsonObject;

function isPromiseLike(value: unknown): value is Promise<unknown> {
	return (
		typeof value === 'object' &&
		value != null &&
		'then' in value &&
		typeof value.then === 'function'
	);
}
