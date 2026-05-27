import { describe, expect, it } from 'vitest';
import { buildUrl } from './build-url';
import { serializePathParams, serializeQueryParams } from './serialize-params';

describe('buildUrl function', () => {
	it('should join base URL and path', () => {
		const result = buildUrl('https://api.example.com/', {
			path: '/items',
			pathSerializer: serializePathParams,
			querySerializer: serializeQueryParams
		});

		expect(result).toBe('https://api.example.com/items');
	});

	it('should let absolute paths override the base URL', () => {
		const result = buildUrl('https://api.example.com', {
			path: 'https://assets.example.com/image.png',
			pathSerializer: serializePathParams,
			querySerializer: serializeQueryParams
		});

		expect(result).toBe('https://assets.example.com/image.png');
	});

	it('should append query params to absolute paths', () => {
		const result = buildUrl('https://api.example.com', {
			path: 'https://assets.example.com/image.png',
			queryParams: {
				width: 400
			},
			pathSerializer: serializePathParams,
			querySerializer: serializeQueryParams
		});

		expect(result).toBe('https://assets.example.com/image.png?width=400');
	});

	it('should use the base URL as-is when path is empty', () => {
		const result = buildUrl('https://api.example.com/graphql', {
			pathSerializer: serializePathParams,
			querySerializer: serializeQueryParams
		});

		expect(result).toBe('https://api.example.com/graphql');
	});

	it('should serialize path params after joining base URL and path', () => {
		const result = buildUrl('https://api.example.com', {
			path: '/items/{itemId}',
			pathParams: {
				itemId: 'item 1'
			},
			pathSerializer: serializePathParams,
			querySerializer: serializeQueryParams
		});

		expect(result).toBe('https://api.example.com/items/item%201');
	});

	it('should append query params to a path without existing search params', () => {
		const result = buildUrl('/items', {
			queryParams: {
				page: 2
			},
			pathSerializer: serializePathParams,
			querySerializer: serializeQueryParams
		});

		expect(result).toBe('/items?page=2');
	});

	it('should append query params to a path with existing search params', () => {
		const result = buildUrl('/items?sort=name', {
			queryParams: {
				page: 2
			},
			pathSerializer: serializePathParams,
			querySerializer: serializeQueryParams
		});

		expect(result).toBe('/items?sort=name&page=2');
	});

	it('should remove a leading question mark from serialized query params', () => {
		const result = buildUrl('/items', {
			queryParams: {
				page: 2
			},
			pathSerializer: serializePathParams,
			querySerializer: () => '?page=2'
		});

		expect(result).toBe('/items?page=2');
	});

	it('should skip query params that serialize to an empty string', () => {
		const result = buildUrl('/items?sort=name', {
			queryParams: {
				page: 2
			},
			pathSerializer: serializePathParams,
			querySerializer: () => ''
		});

		expect(result).toBe('/items?sort=name');
	});
});
