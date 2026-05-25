import { describe, expect, it } from 'vitest';
import { hasStatusCode, HttpError, mapResponseToHttpError } from './HttpError';

describe('HttpError module', () => {
	describe('HttpError class', () => {
		it('should expose response status details', () => {
			// Prepare
			const response = new Response('', {
				status: 404,
				statusText: 'Not Found'
			});

			// Act
			const error = new HttpError(response, {
				data: {
					message: 'Item not found'
				}
			});

			// Assert
			expect(error.name).toBe('HttpError');
			expect(error.code).toBe('#ERR_HTTP_STATUS');
			expect(error.status).toBe(404);
			expect(error.statusText).toBe('Not Found');
			expect(error.response).toBe(response);
			expect(error.data).toEqual({
				message: 'Item not found'
			});
			expect(error.message).toBe(
				'[#ERR_HTTP_STATUS] HTTP request failed with status 404 Not Found'
			);
		});

		it('should use the cause message when no message is provided', () => {
			// Prepare
			const response = new Response('', {
				status: 502,
				statusText: 'Bad Gateway'
			});
			const cause = new Error('Body stream already read');

			// Act
			const error = new HttpError(response, {
				cause
			});

			// Assert
			expect(error.message).toBe(
				'[#ERR_HTTP_STATUS] HTTP request failed with status 502 Bad Gateway: Body stream already read'
			);
			expect(error.cause).toBe(cause);
		});
	});

	describe('hasStatusCode function', () => {
		it('should match HttpError status codes', () => {
			// Prepare
			const error = new HttpError(new Response('', { status: 404 }));

			// Act
			const result = hasStatusCode(error, 404);

			// Assert
			expect(result).toBe(true);
		});

		it('should match status-like objects', () => {
			// Act
			const result = hasStatusCode({ status: 429 }, 429);

			// Assert
			expect(result).toBe(true);
		});

		it('should return false for errors without the status code', () => {
			// Act
			const result = hasStatusCode(new Error('failed'), 500);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('mapResponseToHttpError function', () => {
		it('should extract error details from JSON responses', async () => {
			// Prepare
			const response = Response.json(
				{
					code: '#ERR_NOT_FOUND',
					message: 'Item not found'
				},
				{
					status: 404,
					statusText: 'Not Found'
				}
			);

			// Act
			const error = await mapResponseToHttpError(response);

			// Assert
			expect(error).toBeInstanceOf(HttpError);
			expect(error.code).toBe('#ERR_HTTP_STATUS');
			expect(error.message).toBe(
				'[#ERR_HTTP_STATUS] HTTP request failed with status 404 Not Found: Item not found'
			);
			expect(error.data).toEqual({
				code: '#ERR_NOT_FOUND',
				message: 'Item not found'
			});
		});

		it('should map empty error responses without parse failures', async () => {
			// Prepare
			const response = new Response('', {
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			});

			// Act
			const error = await mapResponseToHttpError(response);

			// Assert
			expect(error).toBeInstanceOf(HttpError);
			expect(error.code).toBe('#ERR_HTTP_STATUS');
			expect(error.message).toBe('[#ERR_HTTP_STATUS] HTTP request failed with status 500');
			expect(error.data).toBeUndefined();
		});

		it('should keep invalid JSON error responses as text', async () => {
			// Prepare
			const response = new Response('Bad gateway', {
				status: 502,
				headers: {
					'Content-Type': 'application/json'
				}
			});

			// Act
			const error = await mapResponseToHttpError(response);

			// Assert
			expect(error).toBeInstanceOf(HttpError);
			expect(error.message).toBe(
				'[#ERR_HTTP_STATUS] HTTP request failed with status 502: Bad gateway'
			);
			expect(error.data).toBe('Bad gateway');
		});

		it('should keep the original response body readable', async () => {
			// Prepare
			const response = Response.json(
				{
					message: 'Not found'
				},
				{
					status: 404
				}
			);

			// Act
			const error = await mapResponseToHttpError(response);

			// Assert
			expect(error.data).toEqual({
				message: 'Not found'
			});
			await expect(response.json()).resolves.toEqual({
				message: 'Not found'
			});
		});
	});
});
