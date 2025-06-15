import { unwrapErr } from '@blgc/utils';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
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

	it('should handle FormData uploads correctly', async () => {
		// Prepare
		const formData = new FormData();
		formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
		formData.append('description', 'Test file upload');

		let receivedFormData: FormData | undefined;

		server.use(
			http.post(new URL('/upload', BASE_URL).toString(), async ({ request }) => {
				// Store the received FormData for assertion
				receivedFormData = await request.formData();
				return HttpResponse.json({ message: 'Upload successful' }, { status: 200 });
			})
		);

		// Act
		const client = createFetchClient({ prefixUrl: BASE_URL });
		const result = await client._baseFetch('/upload', 'POST', {
			body: formData
		});

		// Assert
		expect(result.isOk()).toBe(true);
		expect(result.unwrap().data).toEqual({ message: 'Upload successful' });

		// Verify FormData was received correctly
		expect(receivedFormData).toBeDefined();
		expect(receivedFormData?.get('description')).toBe('Test file upload');

		// Verify file content
		const uploadedFile = receivedFormData?.get('file') as File;
		expect(uploadedFile).toBeInstanceOf(File);
		expect(uploadedFile.name).toBe('test.txt');
		expect(uploadedFile.type).toBe('text/plain');

		// Verify file content
		const fileContent = await uploadedFile.text();
		expect(fileContent).toBe('test content');
	});
});
