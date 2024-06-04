import { describe, expect, it } from 'vitest';

import { deepCopy } from './deep-copy';

describe('deepCopy function', () => {
	it('should correctly copy a simple object', () => {
		const obj = { a: 1, b: 2 };
		const copy = deepCopy(obj);
		expect(copy).toEqual(obj);
		expect(copy).not.toBe(obj);
	});

	it('should correctly copy an object with nested structure', () => {
		const obj = { a: 1, b: { c: 2, d: [3, 4] } };
		const copy = deepCopy(obj);
		expect(copy).toEqual(obj);
		expect(copy.b).not.toBe(obj.b);
		expect(copy.b.d).not.toBe(obj.b.d);
	});

	it('should correctly copy an array', () => {
		const arr = [1, 2, { a: 3 }];
		const copy = deepCopy(arr);
		expect(copy).toEqual(arr);
		expect(copy).not.toBe(arr);
		expect(copy[2]).not.toBe(arr[2]);
	});

	it('should handle null values correctly', () => {
		const obj = { a: null, b: 2 };
		const copy = deepCopy(obj);
		expect(copy).toEqual(obj);
	});
});
