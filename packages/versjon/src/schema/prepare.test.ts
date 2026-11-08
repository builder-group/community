import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineMigration, defineSchema } from './definition';
import { prepareSchemaValue } from './prepare';

describe('prepareSchemaValue function', () => {
	it('should migrate sequentially without mutating the input', () => {
		// Prepare
		const input = {
			$schema: 'saku/example@1',
			title: 'Example'
		};

		// Act
		const schemaValue = prepareSchemaValue(exampleSchemaDefinition, input).unwrap();

		// Assert
		expect(schemaValue).toEqual({
			$schema: 'saku/example@3',
			body: {
				text: 'Example'
			}
		});
		expect(input).toEqual({ $schema: 'saku/example@1', title: 'Example' });
	});

	it('should reject a value from another schema family', () => {
		const result = prepareSchemaValue(exampleSchemaDefinition, {
			$schema: 'saku/other@3',
			body: { text: 'Example' }
		});

		expect(result.error?.code).toBe('#ERR_SCHEMA_REFERENCE');
	});

	it('should reject a newer schema version', () => {
		const result = prepareSchemaValue(exampleSchemaDefinition, {
			$schema: 'saku/example@4',
			body: { text: 'Example' }
		});

		expect(result.error?.code).toBe('#ERR_SCHEMA_REFERENCE');
	});

	it('should reject a missing migration step', () => {
		const definition = defineSchema({
			family: 'saku/example',
			version: 3,
			schema: SExampleV3
		});

		const result = prepareSchemaValue(definition, {
			$schema: 'saku/example@1',
			title: 'Example'
		});

		expect(result.error?.code).toBe('#ERR_SCHEMA_MIGRATION');
	});

	it('should require migrations to produce exactly the next version', () => {
		const definition = defineSchema({
			family: 'saku/example',
			version: 3,
			schema: SExampleV3,
			migrations: {
				1: defineMigration({
					schema: SExampleV1,
					migrate(value) {
						return {
							$schema: 'saku/example@3' as const,
							body: { text: value.title }
						};
					}
				}),
				2: defineMigration({
					schema: SExampleV2,
					migrate(value) {
						return {
							$schema: 'saku/example@3' as const,
							body: { text: value.content }
						};
					}
				})
			}
		});

		const result = prepareSchemaValue(definition, {
			$schema: 'saku/example@1',
			title: 'Example'
		});

		expect(result.error?.code).toBe('#ERR_SCHEMA_MIGRATION');
	});

	it('should reject an invalid migration output', () => {
		const definition = defineSchema({
			family: 'saku/example',
			version: 2,
			schema: SExampleV2,
			migrations: {
				1: defineMigration({
					schema: SExampleV1,
					migrate() {
						return {
							$schema: 'saku/example@2' as const,
							content: 123
						};
					}
				})
			}
		});

		const result = prepareSchemaValue(definition, {
			$schema: 'saku/example@1',
			title: 'Example'
		});

		expect(result.error?.code).toBe('#ERR_SCHEMA_MIGRATION');
	});

	it('should validate historical input before calling its migration', () => {
		const migrate = vi.fn(() => ({ $schema: 'saku/example@2' as const, content: 'Example' }));
		const definition = defineSchema({
			family: 'saku/example',
			version: 2,
			schema: SExampleV2,
			migrations: { 1: defineMigration({ schema: SExampleV1, migrate }) }
		});

		const result = prepareSchemaValue(definition, {
			$schema: 'saku/example@1',
			title: 123
		});

		expect(result.error?.code).toBe('#ERR_SCHEMA_VALUE');
		expect(migrate).not.toHaveBeenCalled();
	});

	it('should preserve caller input when a migration mutates its working value', () => {
		const definition = defineSchema({
			family: 'saku/example',
			version: 2,
			schema: SExampleV2,
			migrations: {
				1: defineMigration({
					schema: SExampleV1,
					migrate(value) {
						value.title = 'Changed';
						return { $schema: 'saku/example@2' as const, content: value.title };
					}
				})
			}
		});
		const input = { $schema: 'saku/example@1', title: 'Example' };

		const value = prepareSchemaValue(definition, input).unwrap();

		expect(value).toEqual({ $schema: 'saku/example@2', content: 'Changed' });
		expect(input.title).toBe('Example');
	});

	it('should reject an invalid current schema value', () => {
		const result = prepareSchemaValue(exampleSchemaDefinition, {
			$schema: 'saku/example@3',
			body: { text: 123 }
		});

		expect(result.error?.code).toBe('#ERR_SCHEMA_VALUE');
	});
});

const SExampleV1 = z.strictObject({
	$schema: z.literal('saku/example@1'),
	title: z.string()
});

const SExampleV2 = z.strictObject({
	$schema: z.literal('saku/example@2'),
	content: z.string()
});

const SExampleV3 = z.strictObject({
	$schema: z.literal('saku/example@3'),
	body: z.strictObject({
		text: z.string()
	})
});

const exampleSchemaDefinition = defineSchema({
	family: 'saku/example',
	version: 3,
	schema: SExampleV3,
	migrations: {
		1: defineMigration({
			schema: SExampleV1,
			migrate(value) {
				return {
					$schema: 'saku/example@2' as const,
					content: value.title
				};
			}
		}),
		2: defineMigration({
			schema: SExampleV2,
			migrate(value) {
				return {
					$schema: 'saku/example@3' as const,
					body: {
						text: value.content
					}
				};
			}
		})
	}
});
