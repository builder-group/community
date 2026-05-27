import { describe, expect, it } from 'vitest';
import { parseParams } from './parse-params';

describe('parseParams function', () => {
	it('should parse boolean strings correctly', () => {
		const query = { boolTrue: 'true', boolFalse: 'false' };
		const parsed = parseParams(query);
		expect(parsed.boolTrue).toBe(true);
		expect(parsed.boolFalse).toBe(false);
	});

	it('should parse number strings correctly', () => {
		const query = { infinity: 'Infinity', number: '123', notNumber: 'abc', whitespace: ' ' };
		const parsed = parseParams(query);
		expect(parsed.infinity).toBe('Infinity');
		expect(parsed.number).toBe(123);
		expect(parsed.notNumber).toBe('abc');
		expect(parsed.whitespace).toBe(' ');
	});

	it('should parse null strings and preserve undefined strings', () => {
		const query = { nullValue: 'null', undefinedValue: 'undefined', empty: '' };
		const parsed = parseParams(query);
		expect(parsed.nullValue).toBe(null);
		expect(parsed.undefinedValue).toBe('undefined');
		expect(parsed.empty).toBe('');
	});

	it('should handle array values correctly', () => {
		const query = { array: ['true', '123', 'null'] };
		const parsed = parseParams(query);
		expect(parsed.array).toEqual([true, 123, null]);
	});

	it('should parse nested objects and arrays correctly', () => {
		const query = { nested: { bool: 'false', numbers: ['1', '2'] } };
		const parsed = parseParams(query);
		expect(parsed.nested).toEqual({ bool: false, numbers: [1, 2] });
	});

	it('should leave non-string values unchanged', () => {
		const query = { value: undefined };
		const parsed = parseParams(query);
		expect(parsed.value).toBeUndefined();
	});
});
