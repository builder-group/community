import { describe, expect, it } from 'vitest';
import { FetchError } from './FetchError';
import { mapErrorToNetworkError, NetworkError } from './NetworkError';

describe('NetworkError module', () => {
	describe('NetworkError class', () => {
		it('should describe failures without an HTTP response', () => {
			// Prepare
			const cause = new Error('offline');

			// Act
			const error = new NetworkError({
				cause
			});

			// Assert
			expect(error).toBeInstanceOf(FetchError);
			expect(error.name).toBe('NetworkError');
			expect(error.code).toBe('#ERR_NETWORK');
			expect(error.message).toBe(
				'[#ERR_NETWORK] Network request failed before receiving an HTTP response: offline'
			);
			expect(error.cause).toBe(cause);
		});
	});

	describe('mapErrorToNetworkError function', () => {
		it('should wrap regular errors as network errors', () => {
			// Prepare
			const cause = new Error('offline');

			// Act
			const result = mapErrorToNetworkError(cause);

			// Assert
			expect(result).toBeInstanceOf(NetworkError);
			expect(result.code).toBe('#ERR_NETWORK');
			expect(result.message).toBe(
				'[#ERR_NETWORK] Network request failed before receiving an HTTP response: offline'
			);
			expect(result.cause).toBe(cause);
		});

		it('should return existing network errors unchanged', () => {
			// Prepare
			const error = new NetworkError();

			// Act
			const result = mapErrorToNetworkError(error);

			// Assert
			expect(result).toBe(error);
		});

		it('should create a network error for unknown thrown values', () => {
			// Act
			const result = mapErrorToNetworkError('offline');

			// Assert
			expect(result).toBeInstanceOf(NetworkError);
			expect(result.code).toBe('#ERR_NETWORK');
			expect(result.message).toBe(
				'[#ERR_NETWORK] Network request failed before receiving an HTTP response: offline'
			);
			expect(result.cause).toBe('offline');
		});
	});
});
