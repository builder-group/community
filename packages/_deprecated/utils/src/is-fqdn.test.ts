import { describe, expect, it } from 'vitest';
import { isFQDN } from './is-fqdn';

describe('isFQDN function', () => {
	describe('Basic domain validation', () => {
		it('should return true for valid domain names', () => {
			expect(isFQDN('example.com')).toBe(true);
			expect(isFQDN('sub.example.com')).toBe(true);
			expect(isFQDN('example.co.uk')).toBe(true);
			expect(isFQDN('xn--example.com')).toBe(true); // Internationalized domain
		});

		it('should return false for invalid domain names', () => {
			expect(isFQDN('example')).toBe(false);
			expect(isFQDN('example.')).toBe(false);
			expect(isFQDN('.example.com')).toBe(false);
			expect(isFQDN('example.123')).toBe(false);
			expect(isFQDN('-example.com')).toBe(false);
			expect(isFQDN('example-.com')).toBe(false);
		});

		it('should return false for non-string inputs', () => {
			expect(isFQDN(null)).toBe(false);
			expect(isFQDN(undefined)).toBe(false);
			expect(isFQDN(123)).toBe(false);
			expect(isFQDN({})).toBe(false);
		});
	});

	describe('IP address detection', () => {
		it('should return false for IPv4 addresses', () => {
			expect(isFQDN('192.168.1.1')).toBe(false);
			expect(isFQDN('255.255.255.255')).toBe(false);
		});

		it('should return false for IPv6 addresses', () => {
			expect(isFQDN('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(false);
			expect(isFQDN('::1')).toBe(false);
		});
	});

	describe('Domain part restrictions', () => {
		it('should validate domain part length', () => {
			// 63 characters is the max for a single part
			const longValidPart = 'a'.repeat(63);
			expect(isFQDN(`${longValidPart}.com`)).toBe(true);

			const tooLongPart = 'a'.repeat(64);
			expect(isFQDN(`${tooLongPart}.com`)).toBe(false);
		});

		it('should reject parts with invalid characters', () => {
			expect(isFQDN('example!.com')).toBe(false);
			expect(isFQDN('exam@ple.com')).toBe(false);
			expect(isFQDN('example$.com')).toBe(false);
		});
	});

	describe('Custom options', () => {
		it('should allow trailing dot when specified', () => {
			expect(isFQDN('example.com.', { allowTrailingDot: true })).toBe(true);
			expect(isFQDN('example.com.')).toBe(false);
		});

		it('should allow wildcard domains when specified', () => {
			expect(isFQDN('*.example.com', { allowWildcard: true })).toBe(true);
			expect(isFQDN('*.example.com')).toBe(false);
		});

		it('should allow underscores when specified', () => {
			expect(isFQDN('sub_domain.example.com', { allowUnderscores: true })).toBe(true);
			expect(isFQDN('sub_domain.example.com')).toBe(false);
		});

		it('should allow numeric TLDs when specified', () => {
			expect(isFQDN('example.123', { allowNumericTld: true })).toBe(true);
			expect(isFQDN('example.123')).toBe(false);
		});

		it('should ignore max length restrictions when specified', () => {
			const longPart = 'a'.repeat(64);
			expect(isFQDN(`${longPart}.com`, { ignoreMaxLength: true })).toBe(true);
			expect(isFQDN(`${longPart}.com`)).toBe(false);
		});

		it('should allow disabling TLD requirement', () => {
			expect(isFQDN('example', { requireTld: false })).toBe(true);
			expect(isFQDN('example')).toBe(false);
		});
	});

	describe('International domain names', () => {
		it('should validate internationalized domain names', () => {
			expect(isFQDN('xn--example.com')).toBe(true);
			expect(isFQDN('müller.de')).toBe(true);
			expect(isFQDN('例子.测试')).toBe(true);
		});

		it('should reject invalid international domain names', () => {
			// Full-width characters are not allowed
			expect(isFQDN('ｅｘａｍｐｌｅ.com')).toBe(false);
		});
	});
});
