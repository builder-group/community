import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createFetchClient } from '../create-fetch-client';
import { withDelay } from './with-delay';

const server = setupServer();

const BASE_URL = 'https://api.example.com';

describe('withDelay function', () => {
	beforeAll(() => {
		server.listen();
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => {
		server.close();
	});

	it('should delay the request by the specified amount of time', async () => {
		const delayInMs = 1000; // 1 second delay

		server.use(
			http.get(new URL('/test', BASE_URL).toString(), () => {
				return HttpResponse.json({ message: 'Success' }, { status: 200 });
			})
		);

		const startTime = Date.now();
		const client = withDelay(createFetchClient({ prefixUrl: BASE_URL }), delayInMs);
		const result = await client._baseFetch('/test', 'GET', {});
		const endTime = Date.now();

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Success' });
		expect(endTime - startTime).toBeGreaterThanOrEqual(delayInMs);
	});

	it('should not delay the request if delayInMs is zero', async () => {
		const delayInMs = 0; // No delay

		server.use(
			http.get(new URL('/test', BASE_URL).toString(), () => {
				return HttpResponse.json({ message: 'Success' }, { status: 200 });
			})
		);

		const startTime = Date.now();
		const client = withDelay(createFetchClient({ prefixUrl: BASE_URL }), delayInMs);
		const result = await client._baseFetch('/test', 'GET', {});
		const endTime = Date.now();

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Success' });
		expect(endTime - startTime).toBeLessThan(500);
	});
});
