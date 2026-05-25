import { unwrapErr } from 'tuple-result';
import { describe, expect, it, vi } from 'vitest';
import { createFetchClient } from '../create-fetch-client';
import { NetworkError } from '../errors';
import type { TFetchLike } from '../types';
import { createDelayMiddleware, delayFeature } from './delay';

describe('delayFeature function', () => {
	describe('request delay', () => {
		it('should wait before forwarding the request to fetch', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				const fetchLike = vi.fn<TFetchLike>(async () => {
					return Response.json({ ok: true });
				});
				const client = createFetchClient({ fetch: fetchLike }).with(delayFeature(1000));

				// Act
				const resultPromise = client.request('GET', '/items');
				await vi.advanceTimersByTimeAsync(999);

				// Assert
				expect(fetchLike).not.toHaveBeenCalled();

				// Act
				await vi.advanceTimersByTimeAsync(1);
				const result = await resultPromise;

				// Assert
				expect(result.unwrap()).toEqual({ ok: true });
				expect(fetchLike).toHaveBeenCalledTimes(1);
			} finally {
				vi.useRealTimers();
			}
		});

		it('should skip the timer for non-positive delays', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				const fetchLike = vi.fn<TFetchLike>(async () => {
					return Response.json({ ok: true });
				});
				const client = createFetchClient({ fetch: fetchLike }).with(delayFeature(0));

				// Act
				const result = await client.request('GET', '/items');

				// Assert
				expect(result.unwrap()).toEqual({ ok: true });
				expect(fetchLike).toHaveBeenCalledTimes(1);
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
					return Response.json({ ok: true });
				});
				const client = createFetchClient({ fetch: fetchLike }).with(delayFeature(1000));

				// Act
				const resultPromise = client.request('GET', '/items', {
					signal: controller.signal
				});
				await vi.advanceTimersByTimeAsync(100);
				controller.abort(new Error('Cancelled'));
				const result = await resultPromise;

				// Assert
				expect(unwrapErr(result)).toBeInstanceOf(NetworkError);
				expect(fetchLike).not.toHaveBeenCalled();
			} finally {
				vi.useRealTimers();
			}
		});
	});

	describe('createDelayMiddleware function', () => {
		it('should create standalone delay middleware', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				const fetchLike = vi.fn<TFetchLike>(async () => {
					return Response.json({ ok: true });
				});
				const fetchWithDelay = createDelayMiddleware(1000)(fetchLike);

				// Act
				const responsePromise = fetchWithDelay('/items', { method: 'GET' });
				await vi.advanceTimersByTimeAsync(999);

				// Assert
				expect(fetchLike).not.toHaveBeenCalled();

				// Act
				await vi.advanceTimersByTimeAsync(1);
				const response = await responsePromise;

				// Assert
				await expect(response.json()).resolves.toEqual({ ok: true });
				expect(fetchLike).toHaveBeenCalledTimes(1);
			} finally {
				vi.useRealTimers();
			}
		});
	});
});
