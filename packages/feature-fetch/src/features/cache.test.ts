import { describe, expect, it, vi } from 'vitest';
import { createFetchClient } from '../create-fetch-client';
import type { TFetchLike } from '../types';
import { cacheFeature, createCacheMiddleware } from './cache';

describe('cacheFeature function', () => {
	describe('default rules', () => {
		it('should cache successful GET responses by URL', async () => {
			// Prepare
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				return Response.json({ requestCount });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(cacheFeature());

			// Act
			const firstResult = await client.request('GET', '/items');
			const secondResult = await client.request('GET', '/items');

			// Assert
			expect(firstResult.unwrap().data).toEqual({ requestCount: 1 });
			expect(secondResult.unwrap().data).toEqual({ requestCount: 1 });
			expect(fetchLike).toHaveBeenCalledTimes(1);
		});

		it('should return a fresh cached response for each read', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return new Response(JSON.stringify({ ok: true }), {
					headers: {
						'Content-Type': 'application/json'
					}
				});
			});
			const client = createFetchClient({ fetch: fetchLike }).with(cacheFeature());

			// Act
			const firstResult = await client.request('GET', '/items');
			const secondResult = await client.request('GET', '/items');

			// Assert
			expect(firstResult.unwrap().data).toEqual({ ok: true });
			expect(secondResult.unwrap().data).toEqual({ ok: true });
			expect(fetchLike).toHaveBeenCalledTimes(1);
		});

		it.each([
			{
				name: 'non-GET requests',
				options: {
					method: 'POST',
					requestOptions: { body: { name: 'Jeff' } }
				},
				responseHeaders: undefined
			},
			{
				name: 'authenticated requests',
				options: {
					method: 'GET',
					requestOptions: { headers: { Authorization: 'Bearer token' } }
				},
				responseHeaders: undefined
			},
			{
				name: 'cache reload requests',
				options: {
					method: 'GET',
					requestOptions: { requestInit: { cache: 'reload' } }
				},
				responseHeaders: undefined
			},
			{
				name: 'cache no-store requests',
				options: {
					method: 'GET',
					requestOptions: { requestInit: { cache: 'no-store' } }
				},
				responseHeaders: undefined
			},
			{
				name: 'private responses',
				options: {
					method: 'GET',
					requestOptions: {}
				},
				responseHeaders: {
					'Cache-Control': 'private, no-store'
				}
			}
		] as const)('should not cache $name by default', async ({ options, responseHeaders }) => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json(
					{ ok: true },
					{
						headers: responseHeaders
					}
				);
			});
			const client = createFetchClient({ fetch: fetchLike }).with(cacheFeature());

			// Act
			await client.request(options.method, '/items', options.requestOptions);
			await client.request(options.method, '/items', options.requestOptions);

			// Assert
			expect(fetchLike).toHaveBeenCalledTimes(2);
		});
	});

	describe('configuration', () => {
		it('should expire cached responses after maxAgeMs', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				vi.setSystemTime(0);

				let requestCount = 0;
				const fetchLike = vi.fn<TFetchLike>(async () => {
					requestCount++;
					return Response.json({ requestCount });
				});
				const client = createFetchClient({ fetch: fetchLike }).with(
					cacheFeature({ maxAgeMs: 100 })
				);

				// Act
				const firstResult = await client.request('GET', '/items');
				vi.setSystemTime(101);
				const secondResult = await client.request('GET', '/items');

				// Assert
				expect(firstResult.unwrap().data).toEqual({ requestCount: 1 });
				expect(secondResult.unwrap().data).toEqual({ requestCount: 2 });
				expect(fetchLike).toHaveBeenCalledTimes(2);
			} finally {
				vi.useRealTimers();
			}
		});

		it('should cap maxAgeMs by response Cache-Control max-age', async () => {
			// Prepare
			vi.useFakeTimers();
			try {
				vi.setSystemTime(0);

				let requestCount = 0;
				const fetchLike = vi.fn<TFetchLike>(async () => {
					requestCount++;
					return Response.json(
						{ requestCount },
						{
							headers: {
								'Cache-Control': 'max-age=1'
							}
						}
					);
				});
				const client = createFetchClient({ fetch: fetchLike }).with(
					cacheFeature({ maxAgeMs: 60_000 })
				);

				// Act
				const firstResult = await client.request('GET', '/items');
				vi.setSystemTime(1001);
				const secondResult = await client.request('GET', '/items');

				// Assert
				expect(firstResult.unwrap().data).toEqual({ requestCount: 1 });
				expect(secondResult.unwrap().data).toEqual({ requestCount: 2 });
				expect(fetchLike).toHaveBeenCalledTimes(2);
			} finally {
				vi.useRealTimers();
			}
		});

		it('should skip storing responses with zero max-age', async () => {
			// Prepare
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				return Response.json(
					{ requestCount },
					{
						headers: {
							'Cache-Control': 'max-age=0'
						}
					}
				);
			});
			const client = createFetchClient({ fetch: fetchLike }).with(cacheFeature());

			// Act
			const firstResult = await client.request('GET', '/items');
			const secondResult = await client.request('GET', '/items');

			// Assert
			expect(firstResult.unwrap().data).toEqual({ requestCount: 1 });
			expect(secondResult.unwrap().data).toEqual({ requestCount: 2 });
			expect(fetchLike).toHaveBeenCalledTimes(2);
		});

		it('should use custom cache rules', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async (url) => {
				return Response.json(
					{ ok: true },
					{
						headers: {
							'x-cacheable': url === '/cached' ? 'true' : 'false'
						}
					}
				);
			});
			const client = createFetchClient({ fetch: fetchLike }).with(
				cacheFeature({
					getCacheKey: (url) => (url === '/cached' ? 'shared-key' : null),
					shouldCache: (response) => response.headers.get('x-cacheable') === 'true'
				})
			);

			// Act
			await client.request('GET', '/skipped');
			await client.request('GET', '/skipped');
			await client.request('GET', '/cached');
			await client.request('GET', '/cached');

			// Assert
			expect(fetchLike).toHaveBeenCalledTimes(3);
		});
	});

	describe('cache property', () => {
		it('should expose cache control methods', async () => {
			// Prepare
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				return Response.json({ requestCount });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(cacheFeature());

			// Act
			const firstResult = await client.request('GET', '/items');
			const secondResult = await client.request('GET', '/items');
			client.cache.invalidate((key) => key.includes('/items'));
			const thirdResult = await client.request('GET', '/items');
			client.cache.clear();
			const fourthResult = await client.request('GET', '/items');

			// Assert
			expect(firstResult.unwrap().data).toEqual({ requestCount: 1 });
			expect(secondResult.unwrap().data).toEqual({ requestCount: 1 });
			expect(thirdResult.unwrap().data).toEqual({ requestCount: 2 });
			expect(fourthResult.unwrap().data).toEqual({ requestCount: 3 });
			expect(fetchLike).toHaveBeenCalledTimes(3);
		});
	});

	describe('createCacheMiddleware function', () => {
		it('should create standalone cache middleware', async () => {
			// Prepare
			let requestCount = 0;
			const fetchLike = vi.fn<TFetchLike>(async () => {
				requestCount++;
				return Response.json({ requestCount });
			});
			const fetchWithCache = createCacheMiddleware()(fetchLike);

			// Act
			const firstResponse = await fetchWithCache('/items', { method: 'GET' });
			const secondResponse = await fetchWithCache('/items', { method: 'GET' });

			// Assert
			await expect(firstResponse.json()).resolves.toEqual({ requestCount: 1 });
			await expect(secondResponse.json()).resolves.toEqual({ requestCount: 1 });
			expect(fetchLike).toHaveBeenCalledTimes(1);
		});
	});
});
