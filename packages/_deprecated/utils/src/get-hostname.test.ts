import { describe, expect, it } from 'vitest';
import { getHostname } from './get-hostname';

describe('getHostname function', () => {
	it('extracts hostname from standard URLs', () => {
		expect(getHostname('https://example.com')).toBe('example.com');
		expect(getHostname('https://api.example.com')).toBe('api.example.com');
		expect(getHostname('https://test.api.example.com')).toBe('test.api.example.com');
	});

	it('handles URLs without protocol', () => {
		expect(getHostname('example.com')).toBe('example.com');
		expect(getHostname('api.example.com')).toBe('api.example.com');
		expect(getHostname('test.api.example.com')).toBe('test.api.example.com');
	});

	it('handles ports, paths, and queries', () => {
		expect(getHostname('https://api.example.com:3000')).toBe('api.example.com');
		expect(getHostname('https://api.example.com/path')).toBe('api.example.com');
		expect(getHostname('https://api.example.com?query=value')).toBe('api.example.com');
	});

	it('supports IPv4 addresses', () => {
		expect(getHostname('http://192.168.1.1')).toBe('192.168.1.1');
		expect(getHostname('192.168.1.1')).toBe('192.168.1.1');
	});

	it('returns null for invalid inputs', () => {
		const invalidCases = ['', 'not-a-url', 'http://', 'https://', 'invalid.ip.1.2.3.4.5'];
		invalidCases.forEach((invalidInput) => {
			expect(getHostname(invalidInput)).toBeNull();
		});
	});
});
