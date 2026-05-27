import { describe, expect, it, vi } from 'vitest';
import type { paths } from '../__tests__/resources/mock-openapi-types';
import type { TFetchLike } from '../types';
import { createOpenApiFetchClient } from './openapi';

describe('openApiFeature function', () => {
	describe('HTTP helper methods', () => {
		it.each([
			['get', 'GET'],
			['post', 'POST'],
			['put', 'PUT'],
			['patch', 'PATCH'],
			['delete', 'DELETE'],
			['options', 'OPTIONS'],
			['head', 'HEAD'],
			['trace', 'TRACE']
		] as const)('should send %s requests with the %s method', async (helperName, method) => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return new Response(null, {
					status: 204
				});
			});
			const client = createOpenApiFetchClient<TMethodPaths>({
				fetch: fetchLike
			});

			// Act
			// @ts-expect-error TS2349: the method table intentionally combines OpenAPI helpers with different signatures
			const result = await client[helperName]('/items');

			// Assert
			expect(result.isOk()).toBe(true);
			expect(fetchLike).toHaveBeenCalledWith(
				'/items',
				expect.objectContaining({
					method
				})
			);
		});

		it('should build URLs from typed path and query params', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ code: 200 });
			});
			const client = createOpenApiFetchClient<paths>({
				fetch: fetchLike
			});

			// Act
			const result = await client.post('/pet/{petId}/uploadImage', {
				pathParams: {
					petId: 10
				},
				queryParams: {
					additionalMetadata: 'front'
				}
			});

			// Assert
			expect(result.isOk()).toBe(true);
			expect(fetchLike).toHaveBeenCalledWith(
				'/pet/10/uploadImage?additionalMetadata=front',
				expect.objectContaining({
					method: 'POST'
				})
			);
		});

		it('should serialize typed request bodies', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 10, name: 'Jeff' });
			});
			const client = createOpenApiFetchClient<paths>({
				fetch: fetchLike,
				baseUrl: 'https://api.example.com'
			});

			// Act
			const result = await client.post('/pet', {
				body: {
					name: 'Jeff',
					photoUrls: []
				}
			});

			// Assert
			expect(result.isOk()).toBe(true);
			expect(fetchLike).toHaveBeenCalledWith(
				'https://api.example.com/pet',
				expect.objectContaining({
					body: JSON.stringify({ name: 'Jeff', photoUrls: [] }),
					method: 'POST'
				})
			);
		});

		it('should include response details when requested', async () => {
			// Prepare
			const responseBody = { id: 10, name: 'Jeff', photoUrls: [] };
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json(responseBody);
			});
			const client = createOpenApiFetchClient<paths>({
				fetch: fetchLike
			});

			// Act
			const result = await client.get('/pet/{petId}', {
				pathParams: {
					petId: 10
				},
				withResponse: true
			});
			const value = result.unwrap();

			// Assert
			expect(value.data).toEqual(responseBody);
			expect(value.response).toBeInstanceOf(Response);
		});

		it('should merge OpenAPI header params with transport headers', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const client = createOpenApiFetchClient<THeaderPaths>({
				fetch: fetchLike
			});

			// Act
			const result = await client.get('/items', {
				headers: {
					'X-Tenant-Id': 'tenant-1',
					'Authorization': 'Bearer token'
				}
			});

			// Assert
			expect(result.isOk()).toBe(true);
			expect(fetchLike).toHaveBeenCalledWith(
				'/items',
				expect.objectContaining({
					headers: expect.objectContaining({
						'x-tenant-id': 'tenant-1',
						'authorization': 'Bearer token'
					})
				})
			);
		});

		it('should serialize DELETE request bodies declared by OpenAPI', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const client = createOpenApiFetchClient<TDeleteBodyPaths>({
				fetch: fetchLike
			});

			// Act
			const result = await client.delete('/items/{itemId}', {
				pathParams: {
					itemId: 'item-1'
				},
				body: {
					reason: 'duplicate'
				}
			});

			// Assert
			expect(result.isOk()).toBe(true);
			expect(fetchLike).toHaveBeenCalledWith(
				'/items/item-1',
				expect.objectContaining({
					body: JSON.stringify({ reason: 'duplicate' }),
					method: 'DELETE'
				})
			);
		});
	});
});

type TMethodPaths = {
	'/items': {
		get: TEmptyOperation;
		post: TEmptyOperation;
		put: TEmptyOperation;
		patch: TEmptyOperation;
		delete: TEmptyOperation;
		options: TEmptyOperation;
		head: TEmptyOperation;
		trace: TEmptyOperation;
	};
};

type TEmptyOperation = {
	requestBody?: never;
	responses: {
		204: {
			content?: never;
		};
	};
};

interface THeaderPaths {
	'/items': {
		get: {
			parameters: {
				header: {
					'X-Tenant-Id': string;
				};
				path?: never;
				query?: never;
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}

interface TDeleteBodyPaths {
	'/items/{itemId}': {
		delete: {
			parameters: {
				path: {
					itemId: string;
				};
				query?: never;
				header?: never;
				cookie?: never;
			};
			requestBody: {
				content: {
					'application/json': {
						reason: string;
					};
				};
			};
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}
