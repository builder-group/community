import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { validateStandardSchema } from './standard-schema';

describe('validateStandardSchema', () => {
	it('should return valid status when the schema has no issues', async () => {
		// Prepare
		const schema = createStandardSchema<string>(() => ({ value: 'valid' }));

		// Act
		const status = await validateStandardSchema(schema, 'valid', 'firstError');

		// Assert
		expect(status).toEqual({ type: 'valid' });
	});

	it('should return valid status when the schema returns an empty issues array', async () => {
		// Prepare
		const schema = createStandardSchema<string>(() => ({ issues: [] }));

		// Act
		const status = await validateStandardSchema(schema, 'value', 'firstError');

		// Assert
		expect(status).toEqual({ type: 'valid' });
	});

	it('should normalize Standard Schema issue paths', async () => {
		// Prepare
		const schema = createStandardSchema<string>(() => ({
			issues: [
				{
					message: 'Required',
					path: [{ key: 'profile' }, 'name']
				}
			]
		}));

		// Act
		const status = await validateStandardSchema(schema, '', 'firstError');

		// Assert
		expect(status).toEqual({
			type: 'invalid',
			errors: [{ message: 'Required', path: ['profile', 'name'] }]
		});
	});

	it('should keep only the first issue in first error mode', async () => {
		// Prepare
		const schema = createStandardSchema<string>(() => ({
			issues: [{ message: 'First' }, { message: 'Second' }]
		}));

		// Act
		const status = await validateStandardSchema(schema, '', 'firstError');

		// Assert
		expect(status).toEqual({
			type: 'invalid',
			errors: [{ message: 'First', path: undefined }]
		});
	});

	it('should collect all issues in all error mode', async () => {
		// Prepare
		const schema = createStandardSchema<string>(() => ({
			issues: [{ message: 'First' }, { message: 'Second' }, { message: 'Third' }]
		}));

		// Act
		const status = await validateStandardSchema(schema, '', 'all');

		// Assert
		expect(status).toEqual({
			type: 'invalid',
			errors: [
				{ message: 'First', path: undefined },
				{ message: 'Second', path: undefined },
				{ message: 'Third', path: undefined }
			]
		});
	});
});

function createStandardSchema<GValue>(
	validate: (value: GValue) => StandardSchemaV1.Result<GValue>
): StandardSchemaV1<GValue> {
	return {
		'~standard': {
			version: 1,
			vendor: 'feature-form-test',
			validate(value) {
				return validate(value as GValue);
			}
		}
	};
}
