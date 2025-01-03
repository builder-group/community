import { describe, expect, it } from 'vitest';
import { parseParams } from './parse-params';

describe('parseRequestQuery function', () => {
	it('should parse boolean strings correctly', () => {
		const query = { boolTrue: 'true', boolFalse: 'false' };
		const parsed = parseParams(query);
		expect(parsed.boolTrue).toBe(true);
		expect(parsed.boolFalse).toBe(false);
	});

	it('should parse number strings correctly', () => {
		const query = { number: '123', notNumber: 'abc' };
		const parsed = parseParams(query);
		expect(parsed.number).toBe(123);
		expect(parsed.notNumber).toBe('abc');
	});

	it('should parse null and undefined strings correctly', () => {
		const query = { nullValue: 'null', undefinedValue: 'undefined', empty: '' };
		const parsed = parseParams(query);
		expect(parsed.nullValue).toBe(null);
		expect(parsed.undefinedValue).toBe(undefined);
		expect(parsed.empty).toBe('');
	});

	it('should handle array values correctly', () => {
		const query = { array: ['true', '123', 'null'] };
		const parsed = parseParams(query);
		expect(parsed.array).toEqual([true, 123, null]);
	});

	it('should handle nested objects correctly', () => {
		const query = { nested: { bool: 'false', number: '42' } };
		const parsed = parseParams(query);
		expect(parsed.nested).toEqual({ bool: false, number: 42 });
	});

	it('should not parse blacklisted keys', () => {
		const query = { parse: 'true', dontParse: '123', alsoparse: 'false' };
		const parsed = parseParams(query, ['dontParse']);
		expect(parsed.parse).toBe(true);
		expect(parsed.dontParse).toBe('123');
		expect(parsed.alsoparse).toBe(false);
	});
});
