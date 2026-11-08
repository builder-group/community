import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { isJsonObject } from '../json';
import { validateSchemaValue } from './validate';

describe('validateSchemaValue function', () => {
	it('should validate a value and return a detached copy', () => {
		const input = { $schema: 'saku/example@1', body: { text: 'Example' } };
		const schema = z.strictObject({
			$schema: z.literal('saku/example@1'),
			body: z.strictObject({ text: z.string() })
		});

		const value = validateSchemaValue(
			{ family: 'saku/example', version: 1, schema },
			input
		).unwrap();

		expect(value).toEqual(input);
		expect(value).not.toBe(input);
		expect(value.body).not.toBe(input.body);
	});

	it('should reject schemas that strip properties', () => {
		const schema = z.object({
			$schema: z.literal('saku/example@1'),
			name: z.string()
		});
		const input = { $schema: 'saku/example@1', name: 'Example', unexpected: true };

		const result = validateSchemaValue({ family: 'saku/example', version: 1, schema }, input);

		expect(result.error?.code).toBe('#ERR_SCHEMA_VALUE');
	});

	it('should reject schemas that normalize property values', () => {
		const schema = z.strictObject({
			$schema: z.literal('saku/example@1'),
			name: z.string().trim()
		});
		const input = { $schema: 'saku/example@1', name: ' Example ' };

		const result = validateSchemaValue({ family: 'saku/example', version: 1, schema }, input);

		expect(result.error?.code).toBe('#ERR_SCHEMA_VALUE');
	});

	it('should accept a Standard Schema validator without Zod', () => {
		const schema: StandardSchemaV1<unknown, { $schema: 'saku/example@1'; name: string }> = {
			'~standard': {
				version: 1,
				vendor: 'example',
				validate(value) {
					if (
						isJsonObject(value) &&
						value['$schema'] === 'saku/example@1' &&
						typeof value['name'] === 'string'
					) {
						return { value: { $schema: 'saku/example@1', name: value['name'] } };
					}
					return { issues: [{ message: 'Invalid example' }] };
				}
			}
		};

		const value = validateSchemaValue(
			{ family: 'saku/example', version: 1, schema },
			{ $schema: 'saku/example@1', name: 'Example' }
		).unwrap();

		expect(value.name).toBe('Example');
	});

	it('should reject asynchronous Standard Schema validators', () => {
		const schema: StandardSchemaV1<unknown, { $schema: 'saku/example@1' }> = {
			'~standard': {
				version: 1,
				vendor: 'example',
				async validate() {
					return { value: { $schema: 'saku/example@1' as const } };
				}
			}
		};

		const result = validateSchemaValue(
			{ family: 'saku/example', version: 1, schema },
			{
				$schema: 'saku/example@1'
			}
		);

		expect(result.error?.code).toBe('#ERR_SCHEMA_VALUE');
	});

	it('should reject a validator that returns a non-JSON value', () => {
		const schema: StandardSchemaV1<unknown, { $schema: 'saku/example@1'; date: Date }> = {
			'~standard': {
				version: 1,
				vendor: 'example',
				validate() {
					return { value: { $schema: 'saku/example@1', date: new Date() } };
				}
			}
		};

		const result = validateSchemaValue(
			{ family: 'saku/example', version: 1, schema },
			{
				$schema: 'saku/example@1'
			}
		);

		expect(result.error?.code).toBe('#ERR_SCHEMA_VALUE');
	});

	it('should preserve caller input when a validator mutates its working value', () => {
		const schema: StandardSchemaV1<unknown, { $schema: 'saku/example@1'; name: string }> = {
			'~standard': {
				version: 1,
				vendor: 'example',
				validate(value) {
					if (!isJsonObject(value)) {
						return { issues: [{ message: 'Expected an object' }] };
					}
					value['name'] = 'Changed';
					return { value: value as { $schema: 'saku/example@1'; name: string } };
				}
			}
		};
		const input = { $schema: 'saku/example@1', name: 'Example' };

		const result = validateSchemaValue({ family: 'saku/example', version: 1, schema }, input);

		expect(result.error?.code).toBe('#ERR_SCHEMA_VALUE');
		expect(input.name).toBe('Example');
	});

	it('should reject a reference that does not identify the supplied value', () => {
		const schema = z.strictObject({ $schema: z.literal('saku/example@1') });
		const result = validateSchemaValue(
			{ family: 'saku/example', version: 1, schema },
			{
				$schema: 'saku/example@2'
			}
		);

		expect(result.error?.code).toBe('#ERR_SCHEMA_REFERENCE');
	});
});
