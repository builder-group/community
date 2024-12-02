import { createValidationContext } from 'validation-adapter';
import { describe, expect, it } from 'vitest';
import {
	booleanValidator,
	emailValidator,
	hostValidator,
	jsonValidator,
	numberValidator,
	portValidator,
	stringValidator,
	urlValidator
} from './validators';

describe('validators', () => {
	describe('stringValidator', () => {
		it('should validate valid strings', async () => {
			const context = createValidationContext<string>('test');
			await stringValidator.validate(context);
			expect(context.hasError()).toBe(false);
			expect(context.value).toBe('test');
		});

		it('should reject non-string values', async () => {
			const context = createValidationContext<string>(123 as any);
			await stringValidator.validate(context);
			expect(context.hasError()).toBe(true);
		});
	});

	describe('booleanValidator', () => {
		it('should validate true values', async () => {
			const trueValues = ['true', 't', 'yes', 'on', '1'];
			for (const value of trueValues) {
				const context = createValidationContext<boolean>(value as any);
				await booleanValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toBe(true);
			}
		});

		it('should validate false values', async () => {
			const falseValues = ['false', 'f', 'no', 'off', '0'];
			for (const value of falseValues) {
				const context = createValidationContext<boolean>(value as any);
				await booleanValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toBe(false);
			}
		});

		it('should reject invalid boolean values', async () => {
			const context = createValidationContext<boolean>('invalid' as any);
			await booleanValidator.validate(context);
			expect(context.hasError()).toBe(true);
		});

		it('should be case insensitive', async () => {
			const upperContext = createValidationContext<boolean>('TRUE' as any);
			await booleanValidator.validate(upperContext);
			expect(upperContext.hasError()).toBe(false);
			expect(upperContext.value).toBe(true);

			const lowerContext = createValidationContext<boolean>('false' as any);
			await booleanValidator.validate(lowerContext);
			expect(lowerContext.hasError()).toBe(false);
			expect(lowerContext.value).toBe(false);
		});
	});

	describe('numberValidator', () => {
		it('should validate valid numbers', async () => {
			const context = createValidationContext<number>('123' as any);
			await numberValidator.validate(context);
			expect(context.hasError()).toBe(false);
			expect(context.value).toBe(123);
		});

		it('should validate negative numbers', async () => {
			const context = createValidationContext<number>('-123.45' as any);
			await numberValidator.validate(context);
			expect(context.hasError()).toBe(false);
			expect(context.value).toBe(-123.45);
		});

		it('should reject invalid numbers', async () => {
			const context = createValidationContext<number>('not-a-number' as any);
			await numberValidator.validate(context);
			expect(context.hasError()).toBe(true);
		});
	});

	describe('emailValidator', () => {
		it('should validate valid email addresses', async () => {
			const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+label@domain.com'];
			for (const email of validEmails) {
				const context = createValidationContext<string>(email);
				await emailValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toBe(email);
			}
		});

		it('should reject invalid email addresses', async () => {
			const invalidEmails = ['test@', '@domain.com', 'test@domain', 'test.com'];
			for (const email of invalidEmails) {
				const context = createValidationContext<string>(email);
				await emailValidator.validate(context);
				expect(context.hasError()).toBe(true);
			}
		});
	});

	describe('hostValidator', () => {
		it('should validate valid domain names', async () => {
			const validDomains = ['example.com', 'sub.domain.co.uk', 'domain.io'];
			for (const domain of validDomains) {
				const context = createValidationContext<string>(domain);
				await hostValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toBe(domain);
			}
		});

		it('should validate valid IPv4 addresses', async () => {
			const validIPs = ['192.168.1.1', '10.0.0.0', '172.16.254.1'];
			for (const ip of validIPs) {
				const context = createValidationContext<string>(ip);
				await hostValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toBe(ip);
			}
		});

		it('should validate valid IPv6 addresses', async () => {
			const validIPs = ['2001:0db8:85a3:0000:0000:8a2e:0370:7334'];
			for (const ip of validIPs) {
				const context = createValidationContext<string>(ip);
				await hostValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toBe(ip);
			}
		});

		it('should reject invalid hosts', async () => {
			const invalidHosts = ['invalid', 'domain', '256.256.256.256', 'domain.-com'];
			for (const host of invalidHosts) {
				const context = createValidationContext<string>(host);
				await hostValidator.validate(context);
				expect(context.hasError()).toBe(true);
			}
		});
	});

	describe('portValidator', () => {
		it('should validate valid port numbers', async () => {
			const validPorts = ['80', '443', '8080', '1', '65535'];
			for (const port of validPorts) {
				const context = createValidationContext<number>(port as any);
				await portValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toBe(parseInt(port, 10));
			}
		});

		it('should reject invalid port numbers', async () => {
			const invalidPorts = ['0', '65536', '-1', 'abc', '3.14'];
			for (const port of invalidPorts) {
				const context = createValidationContext<number>(port as any);
				await portValidator.validate(context);
				expect(context.hasError()).toBe(true);
			}
		});
	});

	describe('urlValidator', () => {
		it('should validate valid URLs', async () => {
			const validURLs = [
				'https://example.com',
				'http://localhost:3000',
				'https://sub.domain.co.uk/path?query=1'
			];
			for (const url of validURLs) {
				const context = createValidationContext<string>(url);
				await urlValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toBe(url);
			}
		});

		it('should reject invalid URLs', async () => {
			const invalidURLs = ['not-a-url', 'http://', 'example.com'];
			for (const url of invalidURLs) {
				const context = createValidationContext<string>(url);
				await urlValidator.validate(context);
				expect(context.hasError()).toBe(true);
			}
		});
	});

	describe('jsonValidator', () => {
		it('should validate valid JSON', async () => {
			const validJSON = ['{"key": "value"}', '[1, 2, 3]', '"string"', '123', 'true', 'null'];
			for (const json of validJSON) {
				const context = createValidationContext<unknown>(json);
				await jsonValidator.validate(context);
				expect(context.hasError()).toBe(false);
				expect(context.value).toEqual(JSON.parse(json));
			}
		});

		it('should reject invalid JSON', async () => {
			const invalidJSON = ['{invalid}', '[1, 2,]', '{"key": value}'];
			for (const json of invalidJSON) {
				const context = createValidationContext<unknown>(json);
				await jsonValidator.validate(context);
				expect(context.hasError()).toBe(true);
			}
		});
	});
});
