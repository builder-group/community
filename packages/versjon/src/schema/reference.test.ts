import { describe, expect, it } from 'vitest';
import { formatSchemaReference, parseSchemaReference, readSchemaReference } from './reference';

describe('schema reference module', () => {
	describe('parseSchemaReference function', () => {
		it('should parse a valid family and version', () => {
			const reference = parseSchemaReference('saku/link-in-bio/node/product@2').unwrap();

			expect(reference).toEqual({
				family: 'saku/link-in-bio/node/product',
				version: 2
			});
		});

		it.each([
			'saku/example',
			'@1',
			'saku@example@1',
			'saku/example@0',
			'saku/example@01',
			'saku/example@9007199254740992'
		])('should reject the invalid reference %s', (reference) => {
			expect(parseSchemaReference(reference).error?.code).toBe('#ERR_SCHEMA_REFERENCE');
		});
	});

	describe('readSchemaReference function', () => {
		it('should read a reference from a schema value', () => {
			const reference = readSchemaReference({
				$schema: 'saku/example@1'
			}).unwrap();

			expect(reference).toEqual({
				family: 'saku/example',
				version: 1
			});
		});

		it('should reject values without a reference', () => {
			expect(readSchemaReference({}).error?.code).toBe('#ERR_SCHEMA_REFERENCE');
		});
	});

	describe('formatSchemaReference function', () => {
		it('should format a family and version', () => {
			expect(
				formatSchemaReference({
					family: 'saku/example',
					version: 1
				})
			).toBe('saku/example@1');
		});
	});
});
