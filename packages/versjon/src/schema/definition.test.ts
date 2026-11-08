import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { VersjonError } from '../error';
import { defineMigration, defineSchema, validateSchemaDefinition } from './definition';

describe('schema definition module', () => {
	describe('defineSchema function', () => {
		it('should throw VersjonError for an invalid definition', () => {
			expect(() => {
				defineSchema({ family: 'saku@example', version: 1, schema: SExampleV1 });
			}).toThrow(VersjonError);
		});
	});

	describe('validateSchemaDefinition function', () => {
		it('should accept a valid definition', () => {
			const result = validateSchemaDefinition({
				family: 'saku/example',
				version: 1,
				schema: SExampleV1
			});

			expect(result.isOk()).toBe(true);
		});

		it.each(['', 'saku@example', null])('should reject the invalid schema family %j', (family) => {
			const result = validateSchemaDefinition({
				family: family as string,
				version: 1,
				schema: SExampleV1
			});

			expect(result.error?.code).toBe('#ERR_SCHEMA_DEFINITION');
		});

		it.each([0, null])('should reject the invalid schema version %j', (version) => {
			const result = validateSchemaDefinition({
				family: 'saku/example',
				version: version as number,
				schema: SExampleV1
			});

			expect(result.error?.code).toBe('#ERR_SCHEMA_DEFINITION');
		});

		it('should reject migration versions that cannot precede the current version', () => {
			const result = validateSchemaDefinition({
				family: 'saku/example',
				version: 1,
				schema: SExampleV1,
				migrations: {
					1: defineMigration({
						schema: SExampleV1,
						migrate(value) {
							return value;
						}
					})
				}
			});

			expect(result.error?.code).toBe('#ERR_SCHEMA_DEFINITION');
		});

		it('should reject noncanonical migration keys', () => {
			const result = validateSchemaDefinition({
				family: 'saku/example',
				version: 2,
				schema: z.strictObject({ $schema: z.literal('saku/example@2') }),
				migrations: {
					'01': defineMigration({
						schema: SExampleV1,
						migrate() {
							return { $schema: 'saku/example@2' as const };
						}
					})
				}
			});

			expect(result.error?.code).toBe('#ERR_SCHEMA_DEFINITION');
		});

		it('should reject a migration chain that does not reach the current version', () => {
			const result = validateSchemaDefinition({
				family: 'saku/example',
				version: 3,
				schema: SExampleV3,
				migrations: {
					1: {
						schema: SExampleV1,
						migrate() {
							return { $schema: 'saku/example@2' as const };
						}
					}
				}
			});

			expect(result.error?.code).toBe('#ERR_SCHEMA_DEFINITION');
		});

		it('should reject a gap within a migration chain', () => {
			const result = validateSchemaDefinition({
				family: 'saku/example',
				version: 4,
				schema: SExampleV4,
				migrations: {
					1: {
						schema: SExampleV1,
						migrate() {
							return { $schema: 'saku/example@2' as const };
						}
					},
					3: {
						schema: SExampleV3,
						migrate() {
							return { $schema: 'saku/example@4' as const };
						}
					}
				}
			});

			expect(result.error?.code).toBe('#ERR_SCHEMA_DEFINITION');
		});
	});
});

const SExampleV1 = z.strictObject({
	$schema: z.literal('saku/example@1')
});

const SExampleV3 = z.strictObject({
	$schema: z.literal('saku/example@3')
});

const SExampleV4 = z.strictObject({
	$schema: z.literal('saku/example@4')
});
