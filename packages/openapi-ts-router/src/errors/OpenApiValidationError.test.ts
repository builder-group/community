import { describe, expect, it } from 'vitest';
import { OpenApiRouterError } from './OpenApiRouterError';
import { OpenApiValidationError } from './OpenApiValidationError';

describe('OpenApiValidationError class', () => {
	it('should expose validation status and issues', () => {
		// Prepare
		const issues = [
			{
				source: 'body' as const,
				message: 'Name is required',
				path: ['name']
			}
		];

		// Act
		const error = new OpenApiValidationError(issues);

		// Assert
		expect(error).toBeInstanceOf(OpenApiRouterError);
		expect(error.name).toBe('OpenApiValidationError');
		expect(error.code).toBe('#ERR_OPENAPI_VALIDATION');
		expect(error.status).toBe(400);
		expect(error.issues).toBe(issues);
		expect(error.message).toBe('[#ERR_OPENAPI_VALIDATION] Name is required');
	});

	it('should summarize multiple validation issues', () => {
		// Prepare
		const issues = [
			{ source: 'body' as const, message: 'Name is required' },
			{ source: 'query' as const, message: 'Limit must be a number' }
		];

		// Act
		const error = new OpenApiValidationError(issues);

		// Assert
		expect(error.message).toBe('[#ERR_OPENAPI_VALIDATION] 2 request validation errors occurred');
	});
});
