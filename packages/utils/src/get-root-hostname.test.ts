import { describe, expect, it } from 'vitest';
import { getRootHostname } from './get-root-hostname';

describe('getRootHostname function', () => {
	it('extracts root hostname from standard URLs', () => {
		expect(getRootHostname('https://example.com')).toBe('example.com');
		expect(getRootHostname('https://example.co.uk')).toBe('co.uk');
		expect(getRootHostname('https://example.io')).toBe('example.io');
	});

	it('handles URLs without protocol', () => {
		expect(getRootHostname('example.com')).toBe('example.com');
		expect(getRootHostname('sub.example.com')).toBe('example.com');
	});

	it('handles subdomains, ports, paths, and queries', () => {
		expect(getRootHostname('https://api.example.com')).toBe('example.com');
		expect(getRootHostname('https://example.com:3000')).toBe('example.com');
		expect(getRootHostname('https://example.com/path')).toBe('example.com');
		expect(getRootHostname('https://example.com?query=value')).toBe('example.com');
	});

	it('supports IPv4 addresses', () => {
		expect(getRootHostname('http://192.168.1.1')).toBe('192.168.1.1');
		expect(getRootHostname('192.168.1.1')).toBe('192.168.1.1');
	});

	it('returns null for invalid inputs', () => {
		const invalidCases = ['', 'not-a-url', 'http://', 'https://', 'invalid.ip.1.2.3.4.5'];
		invalidCases.forEach((invalidInput) => {
			expect(getRootHostname(invalidInput)).toBeNull();
		});
	});
});
