import { Err, Ok, type TResult } from 'tuple-result';
import { VersjonError } from '../error';
import { isJsonObject, type TJsonObject } from '../json';
import type { TSchemaDefinition, TSchemaValue } from './definition';
import { prepareSchemaValue } from './prepare';
import { readSchemaReference } from './reference';
import { validateSchemaValue, type TValidatedSchemaValue } from './validate';

/** Creates a registry keyed by family and throws `VersjonError` for duplicate families. */
export function createSchemaRegistry<GDefinitions extends readonly TSchemaDefinition[]>(
	definitions: GDefinitions
): TSchemaRegistry<GDefinitions[number]> {
	const registry = new Map<string, GDefinitions[number]>();
	for (const definition of definitions) {
		if (registry.has(definition.family)) {
			throw new VersjonError('#ERR_SCHEMA_REGISTRY', {
				message: `Duplicate schema family ${definition.family}`
			});
		}

		registry.set(definition.family, definition);
	}

	return registry;
}

/** Selects a registered family from `$schema`, then validates and migrates the value. */
export function prepareSchemaValueFromRegistry<GDefinition extends TSchemaDefinition>(
	registry: TSchemaRegistry<GDefinition>,
	input: unknown
): TResult<TValidatedSchemaValue<TSchemaValue<GDefinition>>, VersjonError> {
	const [isLookupOk, lookupErr, lookup] = lookupSchemaValue(registry, input);
	if (!isLookupOk) {
		return Err(lookupErr);
	}

	return prepareSchemaValue(lookup.definition, lookup.value);
}

/** Validates a value against its registered current version without running migrations. */
export function validateSchemaValueFromRegistry<GDefinition extends TSchemaDefinition>(
	registry: TSchemaRegistry<GDefinition>,
	input: unknown
): TResult<TValidatedSchemaValue<TSchemaValue<GDefinition>>, VersjonError> {
	const [isLookupOk, lookupErr, lookup] = lookupSchemaValue(registry, input);
	if (!isLookupOk) {
		return Err(lookupErr);
	}
	return validateSchemaValue(lookup.definition, lookup.value);
}

function lookupSchemaValue<GDefinition extends TSchemaDefinition>(
	registry: TSchemaRegistry<GDefinition>,
	input: unknown
): TResult<{ definition: GDefinition; value: TJsonObject }, VersjonError> {
	if (!isJsonObject(input)) {
		return Err(
			new VersjonError('#ERR_SCHEMA_VALUE', {
				message: 'Schema value must be a JSON object'
			})
		);
	}

	const [isReferenceOk, referenceErr, reference] = readSchemaReference(input);
	if (!isReferenceOk) {
		return Err(referenceErr);
	}

	const definition = registry.get(reference.family);
	if (definition == null) {
		return Err(
			new VersjonError('#ERR_SCHEMA_REFERENCE', {
				message: `Unknown schema family ${reference.family}`
			})
		);
	}

	return Ok({ definition, value: input });
}

/** Maps each schema family to its current definition. */
export type TSchemaRegistry<GDefinition extends TSchemaDefinition = TSchemaDefinition> =
	ReadonlyMap<string, GDefinition>;
