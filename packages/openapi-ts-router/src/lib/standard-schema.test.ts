import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { OpenApiRouterError } from '../errors';
import { validateStandardSchema } from './standard-schema';

describe('validateStandardSchema function', () => {
	it('should return the schema output when validation succeeds', async () => {
		const schema = createStandardSchema<number>(() => ({ value: 42 }));

		const result = await validateStandardSchema(schema, '42', 'query');

		expect(result).toEqual({ success: true, value: 42 });
	});

	it('should map validation issues to request issues', async () => {
		const schema = createStandardSchema(() => ({
			issues: [{ message: 'Required', path: [{ key: 'id' }] }]
		}));

		const result = await validateStandardSchema(schema, {}, 'path');

		expect(result).toEqual({
			success: false,
			issues: [{ source: 'path', message: 'Required', path: ['id'] }]
		});
	});

	it('should return a fallback issue when schema returns an empty issue array', async () => {
		const schema = createStandardSchema(() => ({ issues: [] }));

		const result = await validateStandardSchema(schema, {}, 'query');

		expect(result).toEqual({
			success: false,
			issues: [{ source: 'query', message: 'Invalid query.' }]
		});
	});

	it('should wrap thrown schema errors', async () => {
		const schema = createStandardSchema(() => {
			throw new Error('boom');
		});

		await expect(validateStandardSchema(schema, {}, 'body')).rejects.toBeInstanceOf(
			OpenApiRouterError
		);
	});
});

function createStandardSchema<GOutput>(
	validate: () => StandardSchemaV1.Result<GOutput>
): StandardSchemaV1<unknown, GOutput> {
	return {
		'~standard': {
			version: 1,
			vendor: 'test',
			validate
		}
	};
}
