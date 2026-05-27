import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { validateStandardSchema } from './standard-schema';

describe('validateStandardSchema function', () => {
	it('should return the Standard Schema output value', () => {
		// Prepare
		const schema = createStandardSchema<unknown, number>(() => ({ value: 3000 }));

		// Act
		const result = validateStandardSchema(schema, '3000', { envKey: 'PORT' });

		// Assert
		expect(result).toEqual({
			success: true,
			value: 3000
		});
	});

	it('should format Standard Schema issues with env context', () => {
		// Prepare
		const schema = createStandardSchema<unknown, number>(() => ({
			issues: [{ message: 'Must be a number', path: [{ key: 'server' }, 'port'] }]
		}));

		// Act
		const result = validateStandardSchema(schema, 'invalid', {
			envKey: 'PORT',
			description: 'Server port',
			example: '3000'
		});

		// Assert
		expect(result).toEqual({
			success: false,
			error:
				'Invalid value for PORT\nDescription: Server port\nExample: 3000\nError: server.port: Must be a number'
		});
	});

	it('should reject async validators because validateEnv is synchronous', () => {
		// Prepare
		const schema = createStandardSchema<unknown, string>(async () => ({ value: 'secret' }));

		// Act
		const result = validateStandardSchema(schema, 'secret', { envKey: 'API_KEY' });

		// Assert
		expect(result).toEqual({
			success: false,
			error:
				'Validator for API_KEY returned a Promise. validateEnv only supports synchronous Standard Schema validators.'
		});
	});
});

function createStandardSchema<GInput, GOutput = GInput>(
	validate: (
		value: unknown
	) => StandardSchemaV1.Result<GOutput> | Promise<StandardSchemaV1.Result<GOutput>>
): StandardSchemaV1<GInput, GOutput> {
	return {
		'~standard': {
			version: 1,
			vendor: 'test',
			validate
		}
	};
}
