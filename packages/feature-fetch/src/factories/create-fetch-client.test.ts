import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { baseUrl, server, useMockRequestHandler } from '../__tests__/use-mock-request-handler';
import { createFetchClient } from './create-fetch-client';

describe('createFetchClient', () => {
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
		useMockRequestHandler({
			baseUrl,
			method: 'get',
			path: '/test',
			body: { message: 'Success' },
			status: 200
		});

		const client = createFetchClient({ prefixUrl: baseUrl });
		const result = await client._baseFetch('/test', 'GET', {});

		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Success' });
	});

	it('should handle network errors gracefully', async () => {
		useMockRequestHandler({
			baseUrl,
			method: 'get',
			path: '/test',
			status: 500,
			body: { code: 500, message: 'Internal Server Error' }
		});

		const client = createFetchClient({ prefixUrl: baseUrl });
		const result = await client._baseFetch('/test', 'GET', {});

		expect(result.isErr()).toBe(true);
		expect(result.unwrapErr()).toBeInstanceOf(Error);
	});
});
