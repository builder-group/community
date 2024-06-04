import { describe, expect, it } from 'vitest';

import { FetchHeaders } from './FetchHeaders';

describe('FetchHeaders class', () => {
	it('should initialize with no parameters correctly', () => {
		const headers = new FetchHeaders();
		expect(headers).toBeInstanceOf(FetchHeaders);
	});

	it('should append and retrieve a header', () => {
		const headers = new FetchHeaders();
		headers.append('Content-Type', 'application/json');
		expect(headers.get('Content-Type')).toEqual('application/json');
	});

	it('should handle case-insensitive header names', () => {
		const headers = new FetchHeaders();
		headers.set('CONTENT-TYPE', 'application/json');
		expect(headers.get('content-type')).toEqual('application/json');
	});

	it('should overwrite existing headers with set', () => {
		const headers = new FetchHeaders();
		headers.set('Accept', 'application/xml');
		headers.set('Accept', 'application/json');
		expect(headers.get('Accept')).toEqual('application/json');
	});

	it('should return null for non-existent headers', () => {
		const headers = new FetchHeaders();
		expect(headers.get('Authorization')).toBeNull();
	});

	it('should correctly report existence of a header with has', () => {
		const headers = new FetchHeaders();
		headers.set('Content-Type', 'application/json');
		expect(headers.has('Content-Type')).toBeTruthy();
		expect(headers.has('Authorization')).toBeFalsy();
	});

	it('should delete a header', () => {
		const headers = new FetchHeaders();
		headers.set('Content-Type', 'application/json');
		headers.delete('Content-Type');
		expect(headers.has('Content-Type')).toBeFalsy();
	});

	it('should initialize with an object', () => {
		const init = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
		const headers = new FetchHeaders(init);
		expect(headers.get('Accept')).toEqual('application/json');
		expect(headers.get('Content-Type')).toEqual('application/json');
	});

	it('should initialize with an array of key-value pairs', () => {
		const init = [
			['Accept', 'application/json'],
			['Content-Type', 'application/json']
		];
		const headers = new FetchHeaders(init);
		expect(headers.get('Accept')).toEqual('application/json');
		expect(headers.get('Content-Type')).toEqual('application/json');
	});

	it('should initialize with another FetchHeaders instance', () => {
		const original = new FetchHeaders([['Accept', 'application/json']]);
		const headers = new FetchHeaders(original);
		expect(headers.get('Accept')).toEqual('application/json');
	});

	it('should convert to HeadersInit format for single values', () => {
		const headers = new FetchHeaders();
		headers.append('Accept', 'application/json');
		const headersInit = headers.toHeadersInit();
		expect(headersInit).toEqual({ accept: 'application/json' });
	});

	it('should handle multiple values for the same header correctly', () => {
		const headers = new FetchHeaders();
		headers.append('Accept', 'application/json');
		headers.append('accept', 'text/plain');
		headers.append('Content-Type', 'application/x-www-form-urlencoded');
		const headersInit = headers.toHeadersInit();
		expect(headersInit).toEqual({
			'accept': 'application/json, text/plain',
			'content-type': 'application/x-www-form-urlencoded'
		});
	});

	it('should iterate over entries', () => {
		const headers = new FetchHeaders({
			'Accept': 'application/json',
			'Content-Type': 'application/xml'
		});
		const entries = [...headers];
		expect(entries).toEqual([
			['accept', 'application/json'],
			['content-type', 'application/xml']
		]);
	});

	it('should support forEach iteration', () => {
		const headers = new FetchHeaders({ Accept: 'application/json' });
		let count = 0;
		headers.forEach(() => count++);
		expect(count).toEqual(1);
	});

	it('should getSetCookie for multiple set-cookie headers', () => {
		const headers = new FetchHeaders();
		headers.append('Set-Cookie', 'id=a3fWa');
		headers.append('Set-Cookie', 'auth=token');
		expect(headers.getSetCookie()).toEqual(['id=a3fWa', 'auth=token']);
	});

	it('should merge two empty FetchHeaders instances', () => {
		const headers1 = new FetchHeaders();
		const headers2 = new FetchHeaders();
		const merged = FetchHeaders.merge(headers1, headers2);
		expect([...merged]).toEqual([]);
	});

	it('should merge headers with unique names correctly', () => {
		const headers1 = new FetchHeaders([['Content-Type', 'application/json']]);
		const headers2 = new FetchHeaders([['Accept', 'application/xml']]);
		const merged = FetchHeaders.merge(headers1, headers2);
		expect([...merged]).toEqual([
			['content-type', 'application/json'],
			['accept', 'application/xml']
		]);
	});

	it('should append values for matching header names', () => {
		const headers1 = new FetchHeaders([['Accept', 'application/json']]);
		const headers2 = new FetchHeaders([['Accept', 'application/xml']]);
		const merged = FetchHeaders.merge(headers1, headers2);
		expect([...merged.getHeaders()]).toContainEqual([
			'accept',
			['application/json', 'application/xml']
		]);
	});

	it('should retain multiple values for the same header when merged', () => {
		const headers1 = new FetchHeaders();
		headers1.append('Set-Cookie', 'id=a3fWa');
		const headers2 = new FetchHeaders();
		headers2.append('Set-Cookie', 'auth=token');
		const merged = FetchHeaders.merge(headers1, headers2);
		expect(merged.getSetCookie()).toEqual(['id=a3fWa', 'auth=token']);
	});
});
