import { describe, expect, it } from 'vitest';
import { getDomain } from './get-domain';

describe('getDomain function', () => {
	it('extracts domain from standard URLs', () => {
		expect(getDomain('https://example.com')).toBe('example.com');
		expect(getDomain('https://api.example.com')).toBe('api.example.com');
		expect(getDomain('https://test.api.example.com')).toBe('test.api.example.com');
	});

	it('handles URLs without protocol', () => {
		expect(getDomain('example.com')).toBe('example.com');
		expect(getDomain('api.example.com')).toBe('api.example.com');
		expect(getDomain('test.api.example.com')).toBe('test.api.example.com');
	});

	it('handles ports, paths, and queries', () => {
		expect(getDomain('https://api.example.com:3000')).toBe('api.example.com');
		expect(getDomain('https://api.example.com/path')).toBe('api.example.com');
		expect(getDomain('https://api.example.com?query=value')).toBe('api.example.com');
	});

	it('returns null for IPv4 addresses', () => {
		expect(getDomain('http://192.168.1.1')).toBeNull();
		expect(getDomain('192.168.1.1')).toBeNull();
	});

	it('returns null for invalid inputs', () => {
		const invalidCases = ['', 'not-a-url', 'http://', 'https://', 'invalid.ip.1.2.3.4.5'];
		invalidCases.forEach((invalidInput) => {
			expect(getDomain(invalidInput)).toBeNull();
		});
	});
});
