import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createFetchClient } from '../create-fetch-client';
import { RequestException } from '../exceptions';
import { type TFetchLike } from '../types';
import { withRetry } from './with-retry';

const server = setupServer();

const BASE_URL = 'https://api.example.com';

describe('withRetry', () => {
	beforeAll(() => {
		server.listen();
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => {
		server.close();
	});

	it('should retry on network errors and eventually succeed', async () => {
		let retryCount = 0;
		const customFetch: TFetchLike = async (url, init) => {
			retryCount++;
			if (retryCount < 3) {
				throw new Error('Network Error');
			}
			return fetch(url, init);
		};

		server.use(
			http.get(new URL('/test', BASE_URL).toString(), () => {
				return HttpResponse.json({ message: 'Success' }, { status: 200 });
			})
		);

		const client = withRetry(createFetchClient({ prefixUrl: BASE_URL, fetch: customFetch }), {
			maxRetries: 3
		});
		const result = await client._baseFetch('/test', 'GET', {});

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Success' });
		expect(retryCount).toBe(3);
	}, 10000);

	it('should retry on rate limit errors and eventually succeed', async () => {
		let retryCount = 0;
		server.use(
			http.get(new URL('/test', BASE_URL).toString(), () => {
				retryCount++;
				if (retryCount < 3) {
					return HttpResponse.json(
						{ message: 'Rate limit exceeded' },
						{
							status: 429,
							headers: {
								'x-rate-limit-reset': (Date.now() / 1000 + 1).toString() // 1 second reset time
							}
						}
					);
				}
				return HttpResponse.json({ message: 'Success' }, { status: 200 });
			})
		);

		const client = withRetry(createFetchClient({ prefixUrl: BASE_URL }), { maxRetries: 3 });
		const result = await client._baseFetch('/test', 'GET', {});

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Success' });
		expect(retryCount).toBe(3);
	}, 10000);

	it('should not rety on request exception', async () => {
		server.use(
			http.get(new URL('/test', BASE_URL).toString(), () => {
				return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
			})
		);

		const client = withRetry(createFetchClient({ prefixUrl: BASE_URL }), { maxRetries: 3 });
		const result = await client._baseFetch('/test', 'GET', {});

		expect(result.isErr()).toBe(true);
		const error = result.unwrapErr();
		expect(error instanceof RequestException).toBe(true);
		expect((error as RequestException).data).toEqual({ message: 'Internal Server Error' });
	});
});
