import { describe, expect, it, vi } from 'vitest';
import type { TFetchLike } from '../types';
import { createApiFetchClient } from './api';

describe('apiFeature function', () => {
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
				const client = createApiFetchClient({ fetch: fetchLike });

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

		it('should return parsed data by default', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'item-1' });
			});
			const client = createApiFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.get<{ id: string }>('/items/item-1');
			const value = result.unwrap();

			// Assert
			expect(value).toEqual({ id: 'item-1' });
		});

		it('should include response details when requested', async () => {
			// Prepare
			const fetchLike = vi.fn<TFetchLike>(async () => {
				return Response.json({ id: 'item-1' });
			});
			const client = createApiFetchClient({ fetch: fetchLike });

			// Act
			const result = await client.get<{ id: string }>('/items/item-1', {
				withResponse: true
			});
			const value = result.unwrap();

			// Assert
			expect(value.data).toEqual({ id: 'item-1' });
			expect(value.response).toBeInstanceOf(Response);
		});
	});
});
