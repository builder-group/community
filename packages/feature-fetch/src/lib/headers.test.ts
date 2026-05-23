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
				'accept': 'application/json, text/plain'
			});
		});

		it('should append repeated tuple values', () => {
			const headers = normalizeHeaders([
				['Accept', 'application/json'],
				['accept', 'text/plain']
			]);

			expect(headers).toEqual({
				'accept': 'application/json, text/plain'
			});
		});

		it('should read native Headers inputs', () => {
			const headers = normalizeHeaders(
				new Headers({
					Accept: 'application/json',
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
				'authorization': 'Bearer request'
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
		it('should set one header case-insensitively', () => {
			const headers = normalizeHeaders();

			setHeader(headers, 'Content-Type', 'application/json');

			expect(headers).toEqual({
				'content-type': 'application/json'
			});
			expect(getHeader(headers, 'CONTENT-TYPE')).toBe('application/json');
		});
	});

	describe('deleteHeader function', () => {
		it('should delete one header case-insensitively', () => {
			const headers = normalizeHeaders({
				'Content-Type': 'application/json'
			});

			deleteHeader(headers, 'content-type');

			expect(hasHeader(headers, 'Content-Type')).toBe(false);
			expect(getHeader(headers, 'Content-Type')).toBeNull();
		});
	});
});
