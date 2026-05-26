import { describe, expectTypeOf, it } from 'vitest';
import { createApiFetchClient } from './api';

describe('apiFeature function', () => {
	describe('request options', () => {
		it('should reject bodies for methods without request bodies', () => {
			const client = createApiFetchClient();

			void client.get('/items');
			void client.get('/items', {
				headers: {
					'x-request-id': 'request-1'
				}
			});

			void client.get('/items', {
				// @ts-expect-error GET helpers do not accept request bodies.
				body: {
					name: 'Jeff'
				}
			});
		});

		it('should reject body serializers for methods without request bodies', () => {
			const client = createApiFetchClient();

			void client.get('/items', {
				// @ts-expect-error GET helpers do not accept body serializers.
				bodySerializer: (body) => String(body)
			});
		});

		it('should keep body optional unless a request body type is provided', () => {
			const client = createApiFetchClient();

			void client.post('/items');
			void client.post('/items', {
				body: {
					name: 'Jeff'
				}
			});
		});

		it('should require body when a request body type is provided', () => {
			const client = createApiFetchClient();

			void client.post<{ id: string }, { message: string }, { name: string }>('/items', {
				body: {
					name: 'Jeff'
				}
			});

			// @ts-expect-error options are required when a concrete request body type is provided.
			void client.post<{ id: string }, { message: string }, { name: string }>('/items');

			void client.post<{ id: string }, { message: string }, { name: string }>(
				'/items',
				// @ts-expect-error body is required when a concrete request body type is provided.
				{}
			);

			void client.post<{ id: string }, { message: string }, { name: string }>('/items', {
				body: {
					// @ts-expect-error name is required by the provided request body type.
					id: 'item-1'
				}
			});
		});
	});

	describe('response inference', () => {
		it('should infer parsed data by default', async () => {
			const client = createApiFetchClient();

			const result = await client.get<{ id: string }>('/items/item-1');

			if (result.isOk()) {
				expectTypeOf(result.value).toEqualTypeOf<{
					id: string;
				}>();
			}
		});

		it('should infer response details for typed body requests', async () => {
			const client = createApiFetchClient();

			const result = await client.post<{ id: string }, { message: string }, { name: string }>(
				'/items',
				{
					body: {
						name: 'Jeff'
					},
					withResponse: true
				}
			);

			if (result.isOk()) {
				expectTypeOf(result.value).toEqualTypeOf<{
					data: {
						id: string;
					};
					response: Response;
				}>();
			}
		});

		it('should infer response details from generic flags', async () => {
			const client = createApiFetchClient();

			async function getItem<GWithResponse extends boolean>(withResponse: GWithResponse) {
				return client.get<{ id: string }, unknown, 'json', GWithResponse>('/items/item-1', {
					withResponse
				});
			}

			const dataResult = await getItem(false);
			const responseResult = await getItem(true);

			if (dataResult.isOk()) {
				expectTypeOf(dataResult.value).toEqualTypeOf<{
					id: string;
				}>();
			}

			if (responseResult.isOk()) {
				expectTypeOf(responseResult.value).toEqualTypeOf<{
					data: {
						id: string;
					};
					response: Response;
				}>();
			}
		});
	});
});
