import { describe, expect, it } from 'vitest';

import { toArray } from './to-array';

describe('toArray function', () => {
	it('should wrap a single value into an array', () => {
		expect(toArray('hello')).toEqual(['hello']);
		expect(toArray(123)).toEqual([123]);
		expect(toArray(true)).toEqual([true]);
	});

	it('should return an empty array for a single undefined or null value', () => {
		expect(toArray(undefined)).toEqual([undefined]);
		expect(toArray(null)).toEqual([null]);
	});

	it('should return the same array if the input is already an array', () => {
		expect(toArray(['hello', 'world'])).toEqual(['hello', 'world']);
		expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
		expect(toArray([true, false])).toEqual([true, false]);
	});

	it('should handle empty arrays correctly', () => {
		expect(toArray([])).toEqual([]);
	});

	it('should work correctly with objects', () => {
		const obj = { key: 'value' };
		expect(toArray(obj)).toEqual([obj]);
		expect(toArray([obj, obj])).toEqual([obj, obj]);
	});
});
