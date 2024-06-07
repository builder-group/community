import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createFetchClient } from '../../create-fetch-client';
import { withApi } from './with-api';

const server = setupServer();

const BASE_URL = 'https://api.example.com';

describe('withApi function', () => {
	beforeAll(() => {
		server.listen();
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => {
		server.close();
	});

	it('should have correct types', async () => {
		const baseFetchClient = createFetchClient();
		const fetchClient = withApi(baseFetchClient);

		const response = await fetchClient.get('https://dummyjson.com/products/{id}', {
			pathParams: { id: '1' }
		});

		expect(response).not.toBeNull();
	});

	it('should make a GET request successfully', async () => {
		server.use(
			http.get(new URL('/test', BASE_URL).toString(), () => {
				return HttpResponse.json({ message: 'Success' }, { status: 200 });
			})
		);

		const client = withApi(createFetchClient({ prefixUrl: BASE_URL }));
		const result = await client.get('/test');

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Success' });
	});

	it('should make a POST request successfully', async () => {
		server.use(
			http.post(new URL('/test', BASE_URL).toString(), async ({ request }) => {
				const body = await request.json();
				return HttpResponse.json({ message: 'Created', received: body }, { status: 201 });
			})
		);

		const client = withApi(createFetchClient({ prefixUrl: BASE_URL }));
		const result = await client.post('/test', { name: 'John' });

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Created', received: { name: 'John' } });
	});

	it('should make a PUT request successfully', async () => {
		server.use(
			http.put(new URL('/test', BASE_URL).toString(), async ({ request }) => {
				const body = await request.json();
				return HttpResponse.json({ message: 'Updated', received: body }, { status: 200 });
			})
		);

		const client = withApi(createFetchClient({ prefixUrl: BASE_URL }));
		const result = await client.put('/test', { name: 'John Updated' });

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({
			message: 'Updated',
			received: { name: 'John Updated' }
		});
	});

	it('should make a DELETE request successfully', async () => {
		server.use(
			http.delete(new URL('/test', BASE_URL).toString(), () => {
				return HttpResponse.json({ message: 'Deleted' }, { status: 200 });
			})
		);

		const client = withApi(createFetchClient({ prefixUrl: BASE_URL }));
		const result = await client.del('/test');

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Deleted' });
	});
});
