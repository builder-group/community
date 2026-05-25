import { describe, expect, it } from 'vitest';
import {
	deleteHeader,
	getHeader,
	hasHeader,
	mergeHeaders,
	normalizeHeaders,
	setHeader
} from './headers';

describe('headers module', () => {
	describe('normalizeHeaders function', () => {
		it('should normalize record names and primitive values', () => {
			const headers = normalizeHeaders({
				' Content-Type ': ' application/json ',
				'X-Enabled': true,
				'X-Retry': 2
			});

			expect(headers).toEqual({
				'content-type': 'application/json',
				'x-enabled': 'true',
				'x-retry': '2'
			});
		});

		it('should ignore nullish and empty array record values', () => {
			const headers = normalizeHeaders({
				'Accept': [],
				'Authorization': undefined,
				'X-Trace-Id': null
			});

			expect(headers).toEqual({});
		});

		it('should join record array values', () => {
			const headers = normalizeHeaders({
				Accept: ['application/json', 'text/plain']
			});

			expect(headers).toEqual({
				accept: 'application/json, text/plain'
			});
		});

		it('should append repeated tuple values', () => {
			const headers = normalizeHeaders([
				['Accept', 'application/json'],
				['accept', 'text/plain']
			]);

			expect(headers).toEqual({
				accept: 'application/json, text/plain'
			});
		});

		it('should support header names matching object prototype keys', () => {
			const headers = normalizeHeaders([['toString', 'custom']]);

			expect(getHeader(headers, 'toString')).toBe('custom');
		});

		it('should read native Headers inputs', () => {
			const headers = normalizeHeaders(
				new Headers({
					'Accept': 'application/json',
					'X-Trace-Id': 'trace-1'
				})
			);

			expect(headers).toEqual({
				'accept': 'application/json',
				'x-trace-id': 'trace-1'
			});
		});

		it('should preserve commas inside a single value', () => {
			const headers = normalizeHeaders({
				'Content-Disposition': 'attachment; filename="a,b.txt"'
			});

			expect(headers).toEqual({
				'content-disposition': 'attachment; filename="a,b.txt"'
			});
		});
	});

	describe('mergeHeaders function', () => {
		it('should let later record values replace earlier values', () => {
			const headers = mergeHeaders(
				{
					Authorization: 'Bearer default'
				},
				{
					Authorization: 'Bearer request'
				}
			);

			expect(headers).toEqual({
				authorization: 'Bearer request'
			});
		});

		it('should let later native Headers values replace earlier native Headers values', () => {
			const headers = mergeHeaders(
				new Headers({
					Accept: 'application/json',
					Authorization: 'Bearer default'
				}),
				new Headers({
					Authorization: 'Bearer request'
				})
			);

			expect(headers).toEqual({
				accept: 'application/json',
				authorization: 'Bearer request'
			});
		});

		it('should let null remove earlier values', () => {
			const headers = mergeHeaders(
				{
					Authorization: 'Bearer default'
				},
				{
					Authorization: null
				}
			);

			expect(headers).toEqual({});
		});

		it('should keep independent values from every input', () => {
			const headers = mergeHeaders(
				{
					Accept: 'application/json'
				},
				new Headers({
					Authorization: 'Bearer request'
				}),
				[['X-Trace-Id', 'trace-1']]
			);

			expect(headers).toEqual({
				'accept': 'application/json',
				'authorization': 'Bearer request',
				'x-trace-id': 'trace-1'
			});
		});
	});

	describe('setHeader function', () => {
		it('should set one normalized header', () => {
			const headers = normalizeHeaders();

			setHeader(headers, 'Content-Type', 'application/json');

			expect(headers).toEqual({
				'content-type': 'application/json'
			});
		});
	});

	describe('getHeader function', () => {
		it('should get one header case-insensitively', () => {
			const headers = normalizeHeaders({
				'Content-Type': 'application/json'
			});

			expect(getHeader(headers, 'CONTENT-TYPE')).toBe('application/json');
		});

		it('should return null when the header is missing', () => {
			const headers = normalizeHeaders();

			expect(getHeader(headers, 'Content-Type')).toBeNull();
		});

		it('should ignore inherited object keys', () => {
			const headers = normalizeHeaders();

			expect(getHeader(headers, 'toString')).toBeNull();
		});
	});

	describe('hasHeader function', () => {
		it('should check one header case-insensitively', () => {
			const headers = normalizeHeaders({
				'Content-Type': 'application/json'
			});

			expect(hasHeader(headers, 'CONTENT-TYPE')).toBe(true);
		});

		it('should return false when the header is missing', () => {
			const headers = normalizeHeaders();

			expect(hasHeader(headers, 'Content-Type')).toBe(false);
		});

		it('should ignore inherited object keys', () => {
			const headers = normalizeHeaders();

			expect(hasHeader(headers, 'toString')).toBe(false);
		});
	});

	describe('deleteHeader function', () => {
		it('should delete one header case-insensitively', () => {
			const headers = normalizeHeaders({
				'Content-Type': 'application/json'
			});

			deleteHeader(headers, 'content-type');

			expect(headers).toEqual({});
		});
	});
});
