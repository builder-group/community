import { describe, expect, it } from 'vitest';
import { deepEqual } from './deep-equal';

describe('deepEqual function', () => {
	it('should correctly compare simple objects', () => {
		const obj1 = { a: 1, b: 2 };
		const obj2 = { a: 1, b: 2 };
		const obj3 = { a: 1, b: 3 };

		expect(deepEqual(obj1, obj2)).toBe(true);
		expect(deepEqual(obj1, obj3)).toBe(false);
	});

	it('should correctly compare objects with nested structure', () => {
		const obj1 = { a: 1, b: { c: 2, d: [3, 4] } };
		const obj2 = { a: 1, b: { c: 2, d: [3, 4] } };
		const obj3 = { a: 1, b: { c: 2, d: [3, 5] } };

		expect(deepEqual(obj1, obj2)).toBe(true);
		expect(deepEqual(obj1, obj3)).toBe(false);
	});

	it('should correctly compare arrays', () => {
		const arr1 = [1, 2, { a: 3 }];
		const arr2 = [1, 2, { a: 3 }];
		const arr3 = [1, 2, { a: 4 }];

		expect(deepEqual(arr1, arr2)).toBe(true);
		expect(deepEqual(arr1, arr3)).toBe(false);
	});

	it('should handle null values correctly', () => {
		const obj1 = { a: null, b: 2 };
		const obj2 = { a: null, b: 2 };
		const obj3 = { a: null, b: 3 };

		expect(deepEqual(obj1, obj2)).toBe(true);
		expect(deepEqual(obj1, obj3)).toBe(false);
	});

	it('should handle different types correctly', () => {
		const obj = { a: 1 };
		const arr = [1];

		expect(deepEqual(obj, arr as any)).toBe(false);
		expect(deepEqual(null, undefined)).toBe(false);
		expect(deepEqual(null, null)).toBe(true);
	});

	it('should handle objects with different number of keys', () => {
		const obj1 = { a: 1, b: 2 };
		const obj2 = { a: 1 };

		expect(deepEqual(obj1, obj2)).toBe(false);
	});

	it('should correctly compare primitive values', () => {
		// Numbers
		expect(deepEqual(1, 1)).toBe(true);
		expect(deepEqual(1, 2)).toBe(false);
		expect(deepEqual(0, -0)).toBe(true);
		// expect(deepEqual(NaN, NaN)).toBe(true); // TODO: Should we support this? Or keep it simple?

		// Strings
		expect(deepEqual('hello', 'hello')).toBe(true);
		expect(deepEqual('hello', 'world')).toBe(false);
		expect(deepEqual('', '')).toBe(true);

		// Booleans
		expect(deepEqual(true, true)).toBe(true);
		expect(deepEqual(false, false)).toBe(true);
		expect(deepEqual(true, false)).toBe(false);

		// Undefined
		expect(deepEqual(undefined, undefined)).toBe(true);
		expect(deepEqual(undefined, null)).toBe(false);
	});

	it('should handle mixed primitive and object comparisons', () => {
		expect(deepEqual(42, { value: 42 } as any)).toBe(false);
		expect(deepEqual('string', ['string'] as any)).toBe(false);
		expect(deepEqual(true, { value: true } as any)).toBe(false);
	});
});
