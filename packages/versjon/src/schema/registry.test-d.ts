import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { defineSchema } from './definition';
import {
	createSchemaRegistry,
	prepareSchemaValueFromRegistry,
	validateSchemaValueFromRegistry,
	type TSchemaRegistry
} from './registry';

describe('schema registry module', () => {
	it('should narrow prepared values by their current reference', () => {
		const registry = createSchemaRegistry([noteDefinition, taskDefinition]);
		const prepared = prepareSchemaValueFromRegistry(registry, unknownInput).unwrap();

		expectTypeOf(prepared.$schema).toEqualTypeOf<'note@2' | 'task@1'>();
		if (prepared.$schema === 'note@2') {
			expectTypeOf(prepared.heading).toEqualTypeOf<string>();
		} else {
			expectTypeOf(prepared.done).toEqualTypeOf<boolean>();
		}
	});

	it('should narrow validated values by their current reference', () => {
		const registry = createSchemaRegistry([noteDefinition, taskDefinition]);
		const validated = validateSchemaValueFromRegistry(registry, unknownInput).unwrap();

		expectTypeOf(validated.$schema).toEqualTypeOf<'note@2' | 'task@1'>();
		if (validated.$schema === 'task@1') {
			expectTypeOf(validated.done).toEqualTypeOf<boolean>();
		} else {
			expectTypeOf(validated.heading).toEqualTypeOf<string>();
		}
	});

	it('should return a general value for a broadly typed registry', () => {
		const registry: TSchemaRegistry = createSchemaRegistry([noteDefinition, taskDefinition]);
		const value = prepareSchemaValueFromRegistry(registry, unknownInput).unwrap();

		expectTypeOf(value.$schema).toEqualTypeOf<string>();
	});
});

const noteDefinition = defineSchema({
	family: 'note',
	version: 2,
	schema: z.strictObject({ $schema: z.literal('note@2'), heading: z.string() })
});

const taskDefinition = defineSchema({
	family: 'task',
	version: 1,
	schema: z.strictObject({ $schema: z.literal('task@1'), done: z.boolean() })
});

const unknownInput: unknown = {};
