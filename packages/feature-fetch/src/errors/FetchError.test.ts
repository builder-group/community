import { describe, expect, it } from 'vitest';
import { FetchError, mapErrorToFetchError } from './FetchError';

describe('FetchError module', () => {
	describe('FetchError class', () => {
		it('should format explicit messages with the error code', () => {
			// Prepare
			const error = new FetchError('#ERR_EXISTING', {
				message: 'Something failed'
			});

			// Assert
			expect(error.name).toBe('FetchError');
			expect(error.code).toBe('#ERR_EXISTING');
			expect(error.message).toBe('[#ERR_EXISTING] Something failed');
		});

		it('should use the cause message when no message is provided', () => {
			// Prepare
			const cause = new Error('failed');

			// Act
			const error = new FetchError('#ERR_EXISTING', {
				cause
			});

			// Assert
			expect(error.message).toBe('[#ERR_EXISTING] failed');
			expect(error.cause).toBe(cause);
		});

		it('should include a human fallback when only a code is provided', () => {
			// Act
			const error = new FetchError('#ERR_EXISTING');

			// Assert
			expect(error.message).toBe('[#ERR_EXISTING] Feature fetch failed');
		});
	});

	describe('mapErrorToFetchError function', () => {
		it('should return existing fetch errors unchanged', () => {
			// Prepare
			const error = new FetchError('#ERR_EXISTING');

			// Act
			const result = mapErrorToFetchError(error, '#ERR_SERIALIZE_BODY');

			// Assert
			expect(result).toBe(error);
		});

		it('should wrap errors with context and cause details', () => {
			// Prepare
			const cause = new Error('Converting circular structure to JSON');

			// Act
			const result = mapErrorToFetchError(
				cause,
				'#ERR_SERIALIZE_BODY',
				'Failed to serialize request body'
			);

			// Assert
			expect(result).toBeInstanceOf(FetchError);
			expect(result.code).toBe('#ERR_SERIALIZE_BODY');
			expect(result.message).toBe(
				'[#ERR_SERIALIZE_BODY] Failed to serialize request body: Converting circular structure to JSON'
			);
			expect(result.cause).toBe(cause);
		});

		it('should preserve unknown thrown values as the cause', () => {
			// Act
			const result = mapErrorToFetchError('failed', '#ERR_SERIALIZE_BODY');

			// Assert
			expect(result).toBeInstanceOf(FetchError);
			expect(result.message).toBe('[#ERR_SERIALIZE_BODY] failed');
			expect(result.cause).toBe('failed');
		});
	});
});
