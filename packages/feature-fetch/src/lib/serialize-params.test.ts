import { describe, expect, it } from 'vitest';
import { FetchError } from '../errors';
import { serializePathParams, serializeQueryParams } from './serialize-params';

describe('serialize-params module', () => {
	describe('serializePathParams function', () => {
		it('should replace simple path params and encode primitive values', () => {
			const result = serializePathParams('/users/{userId}/posts/{postId}', {
				postId: 'post 1',
				userId: 5
			});

			expect(result).toBe('/users/5/posts/post%201');
		});

		it('should keep missing path params unresolved', () => {
			const result = serializePathParams('/users/{userId}');

			expect(result).toBe('/users/{userId}');
		});

		it('should serialize array path params with the simple default', () => {
			const result = serializePathParams('/items/{ids}', {
				ids: [1, 2, 3]
			});

			expect(result).toBe('/items/1,2,3');
		});

		it('should serialize exploded object path params with simple style', () => {
			const result = serializePathParams('/items/{filter*}', {
				filter: {
					role: 'admin',
					status: 'active'
				}
			});

			expect(result).toBe('/items/role=admin,status=active');
		});

		it('should serialize label-style array path params', () => {
			const result = serializePathParams('/items/{.ids*}', {
				ids: [1, 2]
			});

			expect(result).toBe('/items/.1.2');
		});

		it('should serialize matrix-style object path params', () => {
			const result = serializePathParams('/items/{;filter*}', {
				filter: {
					role: 'admin'
				}
			});

			expect(result).toBe('/items/;role=admin');
		});

		it('should reject unsupported path params', () => {
			expect(() => {
				serializePathParams('/items/{filter}', {
					filter: new URLSearchParams({ role: 'admin' })
				});
			}).toThrow(FetchError);
		});
	});

	describe('serializeQueryParams function', () => {
		it('should serialize query params with OpenAPI defaults', () => {
			const result = serializeQueryParams({
				search: 'weather map',
				tags: ['daily', 'forecast'],
				filter: {
					unit: 'celsius'
				}
			});

			expect(result).toBe('search=weather%20map&tags=daily&tags=forecast&filter[unit]=celsius');
		});

		it('should reject Date query params', () => {
			expect(() => {
				serializeQueryParams({
					createdAt: new Date('2026-05-24T10:20:30.000Z')
				});
			}).toThrow(FetchError);
		});

		it('should skip nullish values and empty arrays', () => {
			const result = serializeQueryParams({
				page: 2,
				search: null,
				tags: [],
				unit: undefined
			});

			expect(result).toBe('page=2');
		});

		it('should return an empty query string when query params are omitted', () => {
			const result = serializeQueryParams();

			expect(result).toBe('');
		});

		it('should skip nullish array items and object properties', () => {
			const result = serializeQueryParams({
				filter: {
					status: undefined,
					unit: 'celsius'
				},
				tags: ['daily', null, 'forecast']
			});

			expect(result).toBe('filter[unit]=celsius&tags=daily&tags=forecast');
		});

		it('should serialize pipe-delimited query arrays', () => {
			const result = serializeQueryParams(
				{
					tags: ['daily', 'forecast']
				},
				{
					array: {
						style: 'pipeDelimited',
						explode: false
					}
				}
			);

			expect(result).toBe('tags=daily|forecast');
		});

		it('should serialize form-style query objects', () => {
			const result = serializeQueryParams(
				{
					filter: {
						role: 'admin',
						status: 'active'
					}
				},
				{
					object: {
						style: 'form',
						explode: false
					}
				}
			);

			expect(result).toBe('filter=role,admin,status,active');
		});

		it('should preserve reserved characters when allowReserved is true', () => {
			const result = serializeQueryParams(
				{
					redirect: '/posts/1?tab=comments'
				},
				{
					allowReserved: true
				}
			);

			expect(result).toBe('redirect=/posts/1?tab=comments');
		});

		it('should reject nested object query params', () => {
			expect(() => {
				serializeQueryParams({
					filter: {
						owner: {
							id: 'user-1'
						}
					}
				});
			}).toThrow(FetchError);
		});
	});
});
