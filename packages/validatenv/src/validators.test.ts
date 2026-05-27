import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import type { TEnvValidator } from './types';
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

describe('validators module', () => {
	describe('stringValidator schema', () => {
		it('should accept strings', () => {
			expectValidatorValue(stringValidator, 'test', 'test');
		});

		it('should reject non-string values', () => {
			expectValidatorIssue(stringValidator, 123);
		});
	});

	describe('booleanValidator schema', () => {
		it('should parse boolean aliases', () => {
			expectValidatorValue(booleanValidator, 'yes', true);
			expectValidatorValue(booleanValidator, 'False', false);
			expectValidatorValue(booleanValidator, true, true);
		});

		it('should reject unsupported values', () => {
			expectValidatorIssue(booleanValidator, 'invalid');
		});
	});

	describe('numberValidator schema', () => {
		it('should parse finite numbers from strings and numbers', () => {
			expectValidatorValue(numberValidator, '123', 123);
			expectValidatorValue(numberValidator, -123.45, -123.45);
		});

		it('should reject empty and non-numeric values', () => {
			expectValidatorIssue(numberValidator, '');
			expectValidatorIssue(numberValidator, 'not-a-number');
		});
	});

	describe('emailValidator schema', () => {
		it('should accept email addresses', () => {
			expectValidatorValue(emailValidator, 'user+label@example.com', 'user+label@example.com');
		});

		it('should reject malformed email addresses', () => {
			expectValidatorIssue(emailValidator, 'test@domain');
		});
	});

	describe('hostValidator schema', () => {
		it('should accept domain names and IP addresses', () => {
			expectValidatorValue(hostValidator, 'example.com', 'example.com');
			expectValidatorValue(hostValidator, '192.168.1.1', '192.168.1.1');
		});

		it('should reject invalid hosts', () => {
			expectValidatorIssue(hostValidator, 'domain');
			expectValidatorIssue(hostValidator, '256.256.256.256');
		});
	});

	describe('portValidator schema', () => {
		it('should parse port numbers inside the valid range', () => {
			expectValidatorValue(portValidator, '1', 1);
			expectValidatorValue(portValidator, '65535', 65535);
		});

		it('should reject invalid port numbers', () => {
			expectValidatorIssue(portValidator, '0');
			expectValidatorIssue(portValidator, '65536');
			expectValidatorIssue(portValidator, '3.14');
		});
	});

	describe('urlValidator schema', () => {
		it('should accept URLs', () => {
			expectValidatorValue(urlValidator, 'https://example.com/path', 'https://example.com/path');
		});

		it('should reject invalid URLs', () => {
			expectValidatorIssue(urlValidator, 'example.com');
		});
	});

	describe('jsonValidator schema', () => {
		it('should parse JSON values', () => {
			expectValidatorValue(jsonValidator, '{"key":"value"}', { key: 'value' });
		});

		it('should reject malformed JSON values', () => {
			expectValidatorIssue(jsonValidator, '{invalid}');
		});
	});
});

function expectValidatorValue<GValue>(
	schema: TEnvValidator<unknown, GValue>,
	value: unknown,
	expectedValue: GValue
): void {
	const result = validateSync(schema, value);

	expect(result).toEqual({ value: expectedValue });
}

function expectValidatorIssue(schema: TEnvValidator<unknown, unknown>, value: unknown): void {
	const result = validateSync(schema, value);

	expect(result).toHaveProperty('issues');
}

function validateSync<GInput, GOutput>(
	schema: TEnvValidator<GInput, GOutput>,
	value: unknown
): StandardSchemaV1.Result<GOutput> {
	const result = schema['~standard'].validate(value);
	if (result instanceof Promise) {
		throw new Error('Test schema unexpectedly returned a Promise.');
	}

	return result;
}
