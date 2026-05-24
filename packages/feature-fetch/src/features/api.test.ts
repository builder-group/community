import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createFetchClient } from '../create-fetch-client';
import type { TFetchLike } from '../types';
import { apiFeature } from './api';

describe('apiFeature function', () => {
	describe('types', () => {
		it('should infer parsed data by default', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'item-1' });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(apiFeature());

			// Act
			const result = await client.get<{ id: string }>('/items/item-1');
			const value = result.unwrap();

			// Assert
			expect(value).toEqual({ id: 'item-1' });
			expectTypeOf(value).toEqualTypeOf<{ id: string }>();
		});

		it('should infer parsed data when options are passed without response details', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'item-1' });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(apiFeature());

			// Act
			const result = await client.get<{ id: string }>('/items/item-1', {
				headers: {
					'x-request-id': 'request-1'
				}
			});
			const value = result.unwrap();

			// Assert
			expect(value).toEqual({ id: 'item-1' });
			expectTypeOf(value).toEqualTypeOf<{ id: string }>();
		});

		it('should infer response details when requested', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'item-1' });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(apiFeature());

			// Act
			const result = await client.get<{ id: string }>('/items/item-1', {
				withResponse: true
			});
			const value = result.unwrap();

			// Assert
			expect(value.data).toEqual({ id: 'item-1' });
			expect(value.response).toBeInstanceOf(Response);
			expectTypeOf(value).toEqualTypeOf<{
				data: {
					id: string;
				};
				response: Response;
			}>();
		});

		it('should infer typed request bodies', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'item-1' });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(apiFeature());

			// Act
			const result = await client.post<{ id: string }, { message: string }, { name: string }>(
				'/items',
				{
					body: { name: 'Jeff' }
				}
			);
			const value = result.unwrap();

			// Assert
			expect(value).toEqual({ id: 'item-1' });
			expectTypeOf(value).toEqualTypeOf<{ id: string }>();
		});

		it('should infer response details for body requests when requested', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'item-1' });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(apiFeature());

			// Act
			const result = await client.post<{ id: string }, { message: string }, { name: string }>(
				'/items',
				{
					body: { name: 'Jeff' },
					withResponse: true
				}
			);
			const value = result.unwrap();

			// Assert
			expect(value.data).toEqual({ id: 'item-1' });
			expect(value.response).toBeInstanceOf(Response);
			expectTypeOf(value).toEqualTypeOf<{
				data: {
					id: string;
				};
				response: Response;
			}>();
		});

		it('should support generic response detail flags', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'item-1' });
			});
			const client = createFetchClient({ fetch: fetchLike }).with(apiFeature());

			async function getItem<GWithResponse extends boolean>(withResponse: GWithResponse) {
				return client.get<{ id: string }, unknown, 'json', GWithResponse>('/items/item-1', {
					withResponse
				});
			}

			// Act
			const dataResult = await getItem(false);
			const responseResult = await getItem(true);
			const dataValue = dataResult.unwrap();
			const responseValue = responseResult.unwrap();

			// Assert
			expect(dataValue).toEqual({ id: 'item-1' });
			expect(responseValue.data).toEqual({ id: 'item-1' });
			expect(responseValue.response).toBeInstanceOf(Response);
			expectTypeOf(dataValue).toEqualTypeOf<{ id: string }>();
			expectTypeOf(responseValue).toEqualTypeOf<{
				data: {
					id: string;
				};
				response: Response;
			}>();
		});
	});

	describe('HTTP helper methods', () => {
		it.each([
			['get', 'GET', undefined, { ok: true }],
			['post', 'POST', { body: { name: 'Jeff' } }, { ok: true }],
			['put', 'PUT', { body: { name: 'Jeff' } }, { ok: true }],
			['patch', 'PATCH', { body: { name: 'Jeff' } }, { ok: true }],
			['delete', 'DELETE', { body: { name: 'Jeff' } }, { ok: true }],
			['options', 'OPTIONS', undefined, { ok: true }],
			['head', 'HEAD', undefined, undefined],
			['trace', 'TRACE', undefined, { ok: true }]
		] as const)(
			'should send %s requests with the %s method',
			async (helperName, method, options, value) => {
				// Prepare
				const fetchLike = vi.fn<TFetchLike>(async () => {
					return Response.json({ ok: true });
				});
				const client = createFetchClient({ fetch: fetchLike }).with(apiFeature());

				// Act
				// @ts-expect-error TS2349: the method table intentionally combines helpers with different option signatures
				const result = await client[helperName]('/items', options);

				// Assert
				const expectedInit =
					options?.body == null
						? { method }
						: {
								body: JSON.stringify(options.body),
								method
							};
				expect(result.unwrap()).toEqual(value);
				expect(fetchLike).toHaveBeenCalledWith('/items', expect.objectContaining(expectedInit));
			}
		);
	});
});
