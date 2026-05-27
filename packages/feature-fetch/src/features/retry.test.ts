import { unwrapErr } from 'tuple-result';
import { describe, expect, it, vi } from 'vitest';
import { createFetchClient } from '../create-fetch-client';
import { HttpError, NetworkError } from '../errors';
import type { TFetchLike } from '../types';
import { createRetryMiddleware, retryFeature } from './retry';

describe('retryFeature function', () => {
	describe('network errors', () => {
		it('should retry thrown network errors', async () => {
			// Prepare
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				if (requestCount < 3) {
					throw new Error('offline');
				}

				return Response.json({ ok: true });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(
				retryFeature({
					maxRetries: 3,
					networkError: { baseDelayMs: 0 }
				})
			);

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(result.unwrap().data).toEqual({ ok: true });
			expect(fetchLike).toHaveBeenCalledTimes(3);
		});

		it('should stop retrying after max retries', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				throw new Error('offline');
			});
			const client = createFetchClient({ fetch: fetchLike }).with(
				retryFeature({
					maxRetries: 1,
					networkError: { baseDelayMs: 0 }
				})
			);

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(unwrapErr(result)).toBeInstanceOf(NetworkError);
			expect(fetchLike).toHaveBeenCalledTimes(2);
		});
	});

	describe('HTTP responses', () => {
		it('should retry HTTP 429 responses', async () => {
			// Prepare
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				if (requestCount < 3) {
					return Response.json({ message: 'Rate limited' }, { status: 429 });
				}

				return Response.json({ ok: true });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(
				retryFeature({
					maxRetries: 3
				})
			);

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(result.unwrap().data).toEqual({ ok: true });
			expect(fetchLike).toHaveBeenCalledTimes(3);
		});

		it('should retry custom response statuses', async () => {
			// Prepare
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				if (requestCount === 1) {
					return Response.json({ message: 'Service unavailable' }, { status: 503 });
				}

				return Response.json({ ok: true });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(
				retryFeature({
					maxRetries: 1,
					shouldRetryResponse: (response) => response.status === 503
				})
			);

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(result.unwrap().data).toEqual({ ok: true });
			expect(fetchLike).toHaveBeenCalledTimes(2);
		});

		it('should cancel retry response bodies before the next attempt', async () => {
			// Prepare
			const cancel = vi.fn();
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				if (requestCount === 1) {
					return new Response(
						new ReadableStream({
							cancel
						}),
						{ status: 429 }
					);
				}

				return Response.json({ ok: true });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(
				retryFeature({
					maxRetries: 1
				})
			);

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(result.unwrap().data).toEqual({ ok: true });
			expect(cancel).toHaveBeenCalledTimes(1);
			expect(fetchLike).toHaveBeenCalledTimes(2);
		});

		it('should not retry other HTTP errors by default', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ message: 'Internal Server Error' }, { status: 500 });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(
				retryFeature({
					maxRetries: 3
				})
			);

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(unwrapErr(result)).toBeInstanceOf(HttpError);
			expect(fetchLike).toHaveBeenCalledTimes(1);
		});
	});

	describe('retry timing', () => {
		it('should delay network retries with exponential backoff', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				let requestCount = 0;
				const fetchLike = vi.fn<TFetchLike>(async () => {
					requestCount++;
					if (requestCount === 1) {
						throw new Error('offline');
					}

					return Response.json({ ok: true });
				});
				const client = createFetchClient({ fetch: fetchLike }).with(
					retryFeature({
						maxRetries: 1,
						networkError: { baseDelayMs: 1000 }
					})
				);

				// Act
				const resultPromise = client.request('GET', '/items');
				await vi.advanceTimersByTimeAsync(999);

				// Assert
				expect(fetchLike).toHaveBeenCalledTimes(1);

				// Act
				await vi.advanceTimersByTimeAsync(1);
				const result = await resultPromise;

				// Assert
				expect(result.unwrap().data).toEqual({ ok: true });
				expect(fetchLike).toHaveBeenCalledTimes(2);
			} finally {
				vi.useRealTimers();
			}
		});

		it('should cap network retry delays', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				let requestCount = 0;
				const fetchLike = vi.fn<TFetchLike>(async () => {
					requestCount++;
					if (requestCount === 1) {
						throw new Error('offline');
					}

					return Response.json({ ok: true });
				});
				const client = createFetchClient({ fetch: fetchLike }).with(
					retryFeature({
						maxRetries: 1,
						networkError: {
							baseDelayMs: 1000,
							maxDelayMs: 250
						}
					})
				);

				// Act
				const resultPromise = client.request('GET', '/items');
				await vi.advanceTimersByTimeAsync(249);

				// Assert
				expect(fetchLike).toHaveBeenCalledTimes(1);

				// Act
				await vi.advanceTimersByTimeAsync(1);
				const result = await resultPromise;

				// Assert
				expect(result.unwrap().data).toEqual({ ok: true });
				expect(fetchLike).toHaveBeenCalledTimes(2);
			} finally {
				vi.useRealTimers();
			}
		});

		it('should use Retry-After delay for HTTP 429 responses', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				let requestCount = 0;
				const fetchLike = vi.fn<TFetchLike>(async () => {
					requestCount++;
					if (requestCount === 1) {
						return Response.json(
							{ message: 'Rate limited' },
							{
								headers: {
									'Retry-After': '1'
								},
								status: 429
							}
						);
					}

					return Response.json({ ok: true });
				});
				const client = createFetchClient({ fetch: fetchLike }).with(
					retryFeature({
						maxRetries: 1
					})
				);

				// Act
				const resultPromise = client.request('GET', '/items');
				await vi.advanceTimersByTimeAsync(999);

				// Assert
				expect(fetchLike).toHaveBeenCalledTimes(1);

				// Act
				await vi.advanceTimersByTimeAsync(1);
				const result = await resultPromise;

				// Assert
				expect(result.unwrap().data).toEqual({ ok: true });
				expect(fetchLike).toHaveBeenCalledTimes(2);
			} finally {
				vi.useRealTimers();
			}
		});

		it('should stop waiting when the request signal aborts', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				const controller = new AbortController();
				const fetchLike = vi.fn<TFetchLike>(async () => {
					throw new Error('offline');
				});
				const client = createFetchClient({ fetch: fetchLike }).with(
					retryFeature({
						maxRetries: 3,
						networkError: { baseDelayMs: 1000 }
					})
				);

				// Act
				const resultPromise = client.request('GET', '/items', {
					signal: controller.signal
				});
				await vi.advanceTimersByTimeAsync(100);
				controller.abort(new Error('Cancelled'));
				const result = await resultPromise;

				// Assert
				expect(unwrapErr(result)).toBeInstanceOf(NetworkError);
				expect(fetchLike).toHaveBeenCalledTimes(1);
			} finally {
				vi.useRealTimers();
			}
		});
	});

	describe('createRetryMiddleware function', () => {
		it('should create standalone retry middleware', async () => {
			// Prepare
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				if (requestCount === 1) {
					throw new Error('offline');
				}

				return Response.json({ ok: true });
			});
			const fetchWithRetry = createRetryMiddleware({
				maxRetries: 1,
				networkError: { baseDelayMs: 0 }
			})(fetchLike);

			// Act
			const response = await fetchWithRetry('/items', { method: 'GET' });

			// Assert
			await expect(response.json()).resolves.toEqual({ ok: true });
			expect(fetchLike).toHaveBeenCalledTimes(2);
		});
	});
});
