import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { defineMigration, defineSchema, type TSchemaValue } from './definition';

describe('schema definition module', () => {
	describe('defineSchema function', () => {
		it('should preserve definition literals and infer the current value', () => {
			const definition = defineSchema({
				family: 'saku/example',
				version: 2,
				schema: SExampleV2,
				migrations: {
					1: defineMigration({
						schema: SExampleV1,
						migrate(value) {
							return {
								$schema: 'saku/example@2' as const,
								content: value.title
							};
						}
					})
				}
			});

			expectTypeOf(definition.family).toEqualTypeOf<'saku/example'>();
			expectTypeOf(definition.version).toEqualTypeOf<2>();
			expectTypeOf<TSchemaValue<typeof definition>>().toEqualTypeOf<{
				$schema: 'saku/example@2';
				content: string;
			}>();

			// @ts-expect-error: Definition fields are readonly to TypeScript callers
			definition.version = 3;
		});

		it('should reject a current schema with a mismatched reference', () => {
			defineSchema({
				family: 'saku/example',
				version: 2,
				// @ts-expect-error: The current schema reference must match its family and version
				schema: SExampleV1
			});
		});

		it('should infer output from a Standard Schema validator', () => {
			const schema: StandardSchemaV1<unknown, { $schema: 'saku/example@1'; count: number }> = {
				'~standard': {
					version: 1,
					vendor: 'example',
					validate() {
						return { value: { $schema: 'saku/example@1', count: 1 } };
					}
				}
			};
			const definition = defineSchema({ family: 'saku/example', version: 1, schema });

			expectTypeOf(definition.family).toEqualTypeOf<'saku/example'>();
			expectTypeOf<TSchemaValue<typeof definition>>().toEqualTypeOf<{
				$schema: 'saku/example@1';
				count: number;
			}>();
		});
	});

	describe('defineMigration function', () => {
		it('should infer its input from the historical schema', () => {
			const migration = defineMigration({
				schema: SExampleV1,
				migrate(value) {
					expectTypeOf(value).toEqualTypeOf<{
						$schema: 'saku/example@1';
						title: string;
					}>();

					return {
						$schema: 'saku/example@2' as const,
						content: value.title
					};
				}
			});

			expectTypeOf(migration.migrate).returns.toEqualTypeOf<{
				$schema: 'saku/example@2';
				content: string;
			}>();
		});
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
