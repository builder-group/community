import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { unwrapErr } from '@blgc/utils';

import { createFetchClient } from './create-fetch-client';

const server = setupServer();

const BASE_URL = 'https://api.example.com';

describe('createFetchClient function', () => {
	beforeAll(() => {
		server.listen();
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => {
		server.close();
	});

	it('should make a GET request successfully', async () => {
		server.use(
			http.get(new URL('/test', BASE_URL).toString(), () => {
				return HttpResponse.json(
					{ message: 'Success' },
					{
						status: 200
					}
				);
			})
		);

		const client = createFetchClient({ prefixUrl: BASE_URL });
		const result = await client._baseFetch('/test', 'GET', {});

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Success' });
	});

	it('should handle network errors gracefully', async () => {
		server.use(
			http.get(new URL('/test', BASE_URL).toString(), () => {
				return HttpResponse.json(
					{ code: 500, message: 'Internal Server Error' },
					{
						status: 500
					}
				);
			})
		);

		const client = createFetchClient({ prefixUrl: BASE_URL });
		const result = await client._baseFetch('/test', 'GET', {});

		expect(result.isErr()).toBe(true);
		expect(unwrapErr(result)).toBeInstanceOf(Error);
	});
});
