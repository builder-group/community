import { unwrapErr } from 'tuple-result';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createFetchClient } from './create-fetch-client';
import { FetchError, HttpError, NetworkError } from './errors';
import type { TFetchLike } from './types';

describe('createFetchClient function', () => {
	describe('request building', () => {
		it('should build the request from client defaults and request options', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'post-1' });
			});
			const client = createFetchClient({
				baseUrl: 'https://api.example.com',
				fetch: fetchLike,
				headers: {
					Authorization: 'Bearer default'
				},
				requestInit: {
					credentials: 'include'
				}
			});

			// Act
			const result = await client.request('POST', '/posts/{postId}', {
				body: {
					title: 'Hello'
				},
				headers: {
					Authorization: 'Bearer request'
				},
				pathParams: { postId: 'post-1' },
				queryParams: { preview: true },
				requestInit: {
					cache: 'no-store'
				}
			});

			// Assert
			expect(result.unwrap().data).toEqual({ id: 'post-1' });
			expect(fetchLike).toHaveBeenCalledWith(
				'https://api.example.com/posts/post-1?preview=true',
				expect.objectContaining({
					body: JSON.stringify({ title: 'Hello' }),
					cache: 'no-store',
					credentials: 'include',
					headers: {
						'authorization': 'Bearer request',
						'content-type': 'application/json; charset=utf-8'
					},
					method: 'POST'
				})
			);
		});

		it('should return response details', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'post-1' });
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.request<{ id: string }>('GET', '/posts/post-1');

			// Assert
			const value = result.unwrap();
			expect(value.data).toEqual({ id: 'post-1' });
			expect(value.response).toBeInstanceOf(Response);
			expectTypeOf(value).toEqualTypeOf<{
				data: {
					id: string;
				};
				response: Response;
			}>();
		});

		it('should leave multipart content type to fetch for FormData bodies', async () => {
			// Prepare
			const formData = new FormData();
			formData.append('file', new Blob(['content']), 'file.txt');
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const client = createFetchClient({
				fetch: fetchLike,
				headers: {
					'Content-Type': 'application/json'
				}
			});

			// Act
			await client.request('POST', '/upload', {
				body: formData
			});

			// Assert
			expect(fetchLike).toHaveBeenCalledWith(
				'/upload',
				expect.objectContaining({
					body: formData,
					headers: {}
				})
			);
		});

		it('should serialize explicit null bodies as JSON', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			await client.request('POST', '/items', {
				body: null
			});

			// Assert
			expect(fetchLike).toHaveBeenCalledWith(
				'/items',
				expect.objectContaining({
					body: 'null',
					headers: {
						'content-type': 'application/json; charset=utf-8'
					}
				})
			);
		});

		it('should omit body headers when no body is provided', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			await client.request('GET', '/items');

			// Assert
			expect(fetchLike).toHaveBeenCalledWith(
				'/items',
				expect.objectContaining({
					body: undefined,
					headers: {}
				})
			);
		});

		it('should use top-level abort signal over request init signal', async () => {
			// Prepare
			const defaultController = new AbortController();
			const requestController = new AbortController();
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const client = createFetchClient({
				fetch: fetchLike,
				requestInit: {
					signal: defaultController.signal
				}
			});

			// Act
			await client.request('GET', '/items', {
				signal: requestController.signal
			});

			// Assert
			expect(fetchLike).toHaveBeenCalledWith(
				'/items',
				expect.objectContaining({
					signal: requestController.signal
				})
			);
		});
	});

	describe('lifecycle hooks', () => {
		it('should prepare request data before URL and body are built', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const prepareRequest = vi.fn((cx) => {
				cx.headers.authorization = 'Bearer prepare';
				cx.pathParams.itemId = 'item-1';
				cx.queryParams.trace = '1';
				cx.requestInit.cache = 'no-store';
			});
			const client = createFetchClient({
				fetch: fetchLike,
				prepareRequest: [prepareRequest]
			});

			// Act
			await client.request('GET', '/items/{itemId}', {
				meta: {
					requestId: 'request-1'
				}
			});

			// Assert
			expect(prepareRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					meta: {
						requestId: 'request-1'
					},
					method: 'GET',
					path: '/items/{itemId}'
				})
			);
			expect(fetchLike).toHaveBeenCalledWith(
				'/items/item-1?trace=1',
				expect.objectContaining({
					cache: 'no-store',
					headers: {
						authorization: 'Bearer prepare'
					}
				})
			);
		});

		it('should prepare responses before parsing', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ status: 'raw' });
			});
			const prepareResponse = vi.fn((cx) => {
				expect(cx.request.meta).toEqual({ requestId: 'request-1' });
				expect(cx.request.url).toBe('/items');
				expect(cx.request.requestInit.method).toBe('GET');

				cx.response = Response.json({ status: 'prepared' });
			});
			const client = createFetchClient({
				fetch: fetchLike,
				prepareResponse: [prepareResponse]
			});

			// Act
			const result = await client.request<{ status: string }>('GET', '/items', {
				meta: {
					requestId: 'request-1'
				}
			});

			// Assert
			expect(result.unwrap().data).toEqual({ status: 'prepared' });
			expect(prepareResponse).toHaveBeenCalledOnce();
		});

		it('should keep mutable metadata scoped to prepare hooks', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const prepareRequest = vi.fn((cx) => {
				cx.meta.requestId = 'request-1';
				cx.meta.stage = 'prepared';
			});
			const prepareResponse = vi.fn((cx) => {
				expect(cx.request.meta).toEqual({
					requestId: 'request-1',
					stage: 'prepared'
				});
			});
			const client = createFetchClient({
				fetch: fetchLike,
				prepareRequest: [prepareRequest],
				prepareResponse: [prepareResponse]
			});

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(result.isOk()).toBe(true);
			expect(prepareRequest).toHaveBeenCalledOnce();
			expect(prepareResponse).toHaveBeenCalledOnce();
			expect(fetchLike).toHaveBeenCalledWith(
				'/items',
				expect.not.objectContaining({
					meta: expect.anything()
				})
			);
		});
	});

	describe('middleware', () => {
		it('should apply global and request middleware around fetch', async () => {
			// Prepare
			const calls: string[] = [];
			const fetchLike = vi.fn<TFetchLike>(async () => {
				calls.push('fetch');
				return Response.json({ ok: true });
			});
			const globalMiddleware =
				(next: TFetchLike): TFetchLike =>
				async (url, init) => {
					calls.push('global:before');
					const response = await next(url, init);
					calls.push('global:after');
					return response;
				};
			const requestMiddleware =
				(next: TFetchLike): TFetchLike =>
				async (url, init) => {
					calls.push('request:before');
					const response = await next(url, init);
					calls.push('request:after');
					return response;
				};
			const client = createFetchClient({
				fetch: fetchLike,
				middleware: [globalMiddleware]
			});

			// Act
			await client.request('GET', '/items', {
				middleware: [requestMiddleware]
			});

			// Assert
			expect(calls).toEqual([
				'global:before',
				'request:before',
				'fetch',
				'request:after',
				'global:after'
			]);
		});
	});

	describe('response parsing', () => {
		it('should normalize method casing for empty response handling', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return new Response('invalid-json', {
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				});
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.request('head', '/items');

			// Assert
			expect(result.unwrap().data).toBeUndefined();
			expect(fetchLike).toHaveBeenCalledWith(
				'/items',
				expect.objectContaining({
					method: 'HEAD'
				})
			);
		});

		it.each([204, 205])(
			'should return undefined data for %i responses without parsing',
			async (status) => {
				// Prepare
				const fetchLike = vi.fn<TFetchLike>(async () => {
					return new Response(null, { status });
				});
				const client = createFetchClient({ fetch: fetchLike });

				// Act
				const result = await client.request('GET', '/items', {
					parseAs: 'text'
				});

				// Assert
				expect(result.unwrap().data).toBeUndefined();
			}
		);

		it('should return undefined data for empty successful responses', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return new Response('', {
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				});
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(result.unwrap().data).toBeUndefined();
		});

		it('should parse chunked responses with zero content length', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return new Response(JSON.stringify({ ok: true }), {
					headers: {
						'Content-Length': '0',
						'Transfer-Encoding': 'Chunked'
					}
				});
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.request<{ ok: boolean }>('GET', '/items');

			// Assert
			expect(result.unwrap().data).toEqual({ ok: true });
		});
	});

	describe('error mapping', () => {
		it('should map missing global fetch to a fetch error', async () => {
			// Prepare
			const originalFetch = globalThis.fetch;
			vi.stubGlobal('fetch', undefined);
			try {
				const client = createFetchClient();

				// Act
				const result = await client.request('GET', '/items');

				// Assert
				const error = unwrapErr(result);
				expect(error).toBeInstanceOf(FetchError);
				expect((error as FetchError).code).toBe('#ERR_MISSING_FETCH');
			} finally {
				vi.stubGlobal('fetch', originalFetch);
			}
		});

		it('should map non-OK responses to http errors', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ message: 'Not found' }, { status: 404 });
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.request('GET', '/missing');

			// Assert
			const error = unwrapErr(result);
			expect(error).toBeInstanceOf(HttpError);
			expect((error as HttpError).status).toBe(404);
			expect((error as HttpError).data).toEqual({ message: 'Not found' });
		});

		it('should map thrown fetch errors to network errors', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				throw new Error('offline');
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(unwrapErr(result)).toBeInstanceOf(NetworkError);
		});

		it('should keep fetch errors thrown by middleware unchanged', async () => {
			// Prepare
			const thrownError = new FetchError('#ERR_CUSTOM', {
				message: 'Middleware failed'
			});
			const client = createFetchClient({
				middleware: [
					() => async () => {
						throw thrownError;
					}
				]
			});

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(unwrapErr(result)).toBe(thrownError);
		});

		it('should map prepare request failures to fetch errors', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const client = createFetchClient({
				fetch: fetchLike,
				prepareRequest: [
					() => {
						throw new Error('Prepare failed');
					}
				]
			});

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			const error = unwrapErr(result);
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe('#ERR_PREPARE_REQUEST');
			expect(fetchLike).not.toHaveBeenCalled();
		});

		it('should map prepare response failures to fetch errors', async () => {
			// Prepare
			const client = createFetchClient({
				fetch: async () => Response.json({ ok: true }),
				prepareResponse: [
					() => {
						throw new Error('Prepare response failed');
					}
				]
			});

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			const error = unwrapErr(result);
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe('#ERR_PREPARE_RESPONSE');
		});

		it('should map middleware setup failures to fetch errors', async () => {
			// Prepare
			const client = createFetchClient({
				middleware: [
					() => {
						throw new Error('Middleware setup failed');
					}
				]
			});

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			const error = unwrapErr(result);
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe('#ERR_FETCH_MIDDLEWARE');
		});

		it('should map response parse failures to fetch errors', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return new Response('invalid-json', {
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				});
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.request('GET', '/items');

			// Assert
			expect(unwrapErr(result)).toBeInstanceOf(FetchError);
		});

		it('should map URL build failures to fetch errors', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ ok: true });
			});
			const client = createFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.request('GET', '/items', {
				pathSerializer: () => {
					throw new Error('Failed to serialize path');
				}
			});

			// Assert
			const error = unwrapErr(result);
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe('#ERR_BUILD_URL');
			expect(fetchLike).not.toHaveBeenCalled();
		});
	});
});
