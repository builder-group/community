import { describe, expect, it } from 'vitest';
import { isIP, isIPv4, isIPv6 } from './is-ip';

describe('IP Validation Functions', () => {
	describe('isIPv4 function', () => {
		it('should return true for valid IPv4 addresses', () => {
			expect(isIPv4('0.0.0.0')).toBe(true);
			expect(isIPv4('255.255.255.255')).toBe(true);
			expect(isIPv4('192.168.1.1')).toBe(true);
			expect(isIPv4('10.0.0.1')).toBe(true);
			expect(isIPv4('172.16.0.1')).toBe(true);
		});

		it('should return false for invalid IPv4 addresses', () => {
			expect(isIPv4('256.0.0.1')).toBe(false);
			expect(isIPv4('192.168.1.256')).toBe(false);
			expect(isIPv4('192.168.01.1')).toBe(false);
			expect(isIPv4('192.168.1.1.1')).toBe(false);
			expect(isIPv4('192.168.1')).toBe(false);
			expect(isIPv4('192.168.1.')).toBe(false);
			expect(isIPv4('192.168.1.a')).toBe(false);
		});

		it('should return false for non-string inputs', () => {
			expect(isIPv4(null)).toBe(false);
			expect(isIPv4(undefined)).toBe(false);
			expect(isIPv4(123)).toBe(false);
			expect(isIPv4({})).toBe(false);
		});
	});

	describe('isIPv6 function', () => {
		it('should return true for valid IPv6 addresses', () => {
			expect(isIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
			expect(isIPv6('2001:db8:85a3:0:0:8a2e:370:7334')).toBe(true);
			expect(isIPv6('::1')).toBe(true);
			expect(isIPv6('2001:db8::')).toBe(true);
			expect(isIPv6('::ffff:192.0.2.1')).toBe(true);
			expect(isIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334%eth0')).toBe(true);
		});

		it('should return false for invalid IPv6 addresses', () => {
			expect(isIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334:extra')).toBe(false);
			expect(isIPv6('2001:db8')).toBe(false);
			expect(isIPv6(':::')).toBe(false);
			expect(isIPv6('2001:db8:85a3::8a2e:370:7334:extra')).toBe(false);
			expect(isIPv6('2001:db8:85a3:0000:0000:8a2e:0370:7334g')).toBe(false);
		});

		it('should return false for non-string inputs', () => {
			expect(isIPv6(null)).toBe(false);
			expect(isIPv6(undefined)).toBe(false);
			expect(isIPv6(123)).toBe(false);
			expect(isIPv6({})).toBe(false);
		});
	});

	describe('isIP function', () => {
		it('should return true for valid IPv4 addresses', () => {
			expect(isIP('192.168.1.1')).toBe(true);
			expect(isIP('10.0.0.1')).toBe(true);
			expect(isIP('255.255.255.255')).toBe(true);
		});

		it('should return true for valid IPv6 addresses', () => {
			expect(isIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
			expect(isIP('::1')).toBe(true);
			expect(isIP('2001:db8::')).toBe(true);
		});

		it('should return false for invalid IP addresses', () => {
			expect(isIP('256.0.0.1')).toBe(false);
			expect(isIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334:extra')).toBe(false);
			expect(isIP('not an ip')).toBe(false);
		});

		it('should return false for non-string inputs', () => {
			expect(isIP(null)).toBe(false);
			expect(isIP(undefined)).toBe(false);
			expect(isIP(123)).toBe(false);
			expect(isIP({})).toBe(false);
		});
	});
});
