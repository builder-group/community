import { describe, expect, it } from 'vitest';

import { parseRequestQuery } from './parse-request-query';

describe('parseRequestQuery function', () => {
	it('should parse boolean strings correctly', () => {
		const query = { boolTrue: 'true', boolFalse: 'false' };
		const parsed = parseRequestQuery(query);
		expect(parsed.boolTrue).toBe(true);
		expect(parsed.boolFalse).toBe(false);
	});

	it('should parse number strings correctly', () => {
		const query = { number: '123', notNumber: 'abc' };
		const parsed = parseRequestQuery(query);
		expect(parsed.number).toBe(123);
		expect(parsed.notNumber).toBe('abc');
	});

	it('should parse null and undefined strings correctly', () => {
		const query = { nullValue: 'null', undefinedValue: 'undefined', empty: '' };
		const parsed = parseRequestQuery(query);
		expect(parsed.nullValue).toBe(null);
		expect(parsed.undefinedValue).toBe(undefined);
		expect(parsed.empty).toBe('');
	});

	it('should handle array values correctly', () => {
		const query = { array: ['true', '123', 'null'] };
		const parsed = parseRequestQuery(query);
		expect(parsed.array).toEqual([true, 123, null]);
	});

	it('should handle nested objects correctly', () => {
		const query = { nested: { bool: 'false', number: '42' } };
		const parsed = parseRequestQuery(query);
		expect(parsed.nested).toEqual({ bool: false, number: 42 });
	});
});
