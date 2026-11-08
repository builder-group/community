import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { VersjonError } from '../error';
import { defineMigration, defineSchema } from './definition';
import {
	createSchemaRegistry,
	prepareSchemaValueFromRegistry,
	validateSchemaValueFromRegistry
} from './registry';

describe('schema registry module', () => {
	describe('createSchemaRegistry function', () => {
		it('should create a registry keyed by schema family', () => {
			const registry = createSchemaRegistry([exampleSchemaDefinition]);

			expect(registry.get('saku/example')).toBe(exampleSchemaDefinition);
		});

		it('should reject duplicate schema families', () => {
			expect(() => {
				createSchemaRegistry([exampleSchemaDefinition, exampleSchemaDefinition]);
			}).toThrow(VersjonError);
		});
	});

	describe('prepareSchemaValueFromRegistry function', () => {
		it('should migrate a value using its registered family', () => {
			const registry = createSchemaRegistry([
				defineSchema({
					family: 'saku/example',
					version: 2,
					schema: SExampleV2,
					migrations: {
						1: defineMigration({
							schema: exampleSchemaDefinition.schema,
							migrate(value) {
								return { $schema: 'saku/example@2' as const, name: value.name };
							}
						})
					}
				})
			]);

			const value = prepareSchemaValueFromRegistry(registry, {
				$schema: 'saku/example@1',
				name: 'Example'
			}).unwrap();

			expect(value).toEqual({
				$schema: 'saku/example@2',
				name: 'Example'
			});
		});

		it('should reject an unknown schema family', () => {
			const registry = createSchemaRegistry([]);

			const result = prepareSchemaValueFromRegistry(registry, {
				$schema: 'saku/example@1',
				name: 'Example'
			});

			expect(result.error?.code).toBe('#ERR_SCHEMA_REFERENCE');
		});
	});

	describe('validateSchemaValueFromRegistry function', () => {
		it('should validate a value using its registered current schema', () => {
			const registry = createSchemaRegistry([exampleSchemaDefinition]);
			const input = { $schema: 'saku/example@1', name: 'Example' };
			const value = validateSchemaValueFromRegistry(registry, input).unwrap();

			expect(value).toEqual(input);
		});

		it('should reject a historical version without running its migration', () => {
			const migrate = vi.fn(() => ({ $schema: 'saku/example@2' as const, name: 'Migrated' }));
			const registry = createSchemaRegistry([
				defineSchema({
					family: 'saku/example',
					version: 2,
					schema: SExampleV2,
					migrations: { 1: { schema: exampleSchemaDefinition.schema, migrate } }
				})
			]);
			const result = validateSchemaValueFromRegistry(registry, {
				$schema: 'saku/example@1',
				name: 'Example'
			});

			expect(result.error?.code).toBe('#ERR_SCHEMA_REFERENCE');
			expect(migrate).not.toHaveBeenCalled();
		});
	});
});

const exampleSchemaDefinition = defineSchema({
	family: 'saku/example',
	version: 1,
	schema: z.strictObject({
		$schema: z.literal('saku/example@1'),
		name: z.string()
	})
});

const SExampleV2 = exampleSchemaDefinition.schema.extend({ $schema: z.literal('saku/example@2') });
