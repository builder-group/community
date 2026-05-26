import { describe, expect, it } from 'vitest';
import { OpenApiRouterError } from './OpenApiRouterError';

describe('OpenApiRouterError class', () => {
	it('should format explicit messages with the error code', () => {
		// Prepare
		const error = new OpenApiRouterError('#ERR_OPENAPI_SCHEMA', {
			message: 'Schema failed'
		});

		// Assert
		expect(error.name).toBe('OpenApiRouterError');
		expect(error.code).toBe('#ERR_OPENAPI_SCHEMA');
		expect(error.message).toBe('[#ERR_OPENAPI_SCHEMA] Schema failed');
	});

	it('should keep request status metadata when provided', () => {
		// Act
		const error = new OpenApiRouterError('#ERR_OPENAPI_PARSE_BODY', {
			message: 'Failed to parse request body as JSON',
			status: 400
		});

		// Assert
		expect(error.status).toBe(400);
		expect(error.message).toBe(
			'[#ERR_OPENAPI_PARSE_BODY] Failed to parse request body as JSON'
		);
	});

	it('should use the cause message when no message is provided', () => {
		// Prepare
		const cause = new Error('Unexpected token');

		// Act
		const error = new OpenApiRouterError('#ERR_OPENAPI_PARSE_BODY', {
			cause
		});

		// Assert
		expect(error.message).toBe('[#ERR_OPENAPI_PARSE_BODY] Unexpected token');
		expect(error.cause).toBe(cause);
	});

	it('should include a human fallback when only a code is provided', () => {
		// Act
		const error = new OpenApiRouterError('#ERR_OPENAPI_SCHEMA');

		// Assert
		expect(error.message).toBe('[#ERR_OPENAPI_SCHEMA] OpenAPI router failed');
	});
});
