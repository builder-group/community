import { describe, expect, it } from 'vitest';
import { getNestedProperty } from './get-nested-property';

describe('getNestedProperty function', () => {
	it('should return the correct value for a nested string property', () => {
		const obj = {
			level1: {
				level2: 'hello'
			}
		};
		expect(getNestedProperty(obj, 'level1.level2')).toBe('hello');
	});

	it('should return the correct value for a nested number property', () => {
		const obj = {
			level1: {
				level2: 42
			}
		};
		expect(getNestedProperty(obj, 'level1.level2')).toBe(42);
	});

	it('should return undefined for a non-existent nested property', () => {
		const obj = {
			level1: {
				level2: 'hello'
			}
		};
		expect(getNestedProperty(obj, 'level1.nonExistent' as any)).toBe(undefined);
	});

	it('should return undefined for a non-existent root level property', () => {
		const obj = {
			level1: {
				level2: 'hello'
			}
		};
		expect(getNestedProperty(obj, 'nonExistent' as any)).toBe(undefined);
	});

	it('should return the correct value for deeply nested properties', () => {
		const obj = {
			level1: {
				level2: {
					level3: 'deep value'
				}
			}
		};
		expect(getNestedProperty(obj, 'level1.level2.level3')).toBe('deep value');
	});

	it('should handle empty path and return undefined', () => {
		const obj = {
			level1: {
				level2: 'hello'
			}
		};
		expect(getNestedProperty(obj, '' as any)).toBe(undefined);
	});

	it('should handle non-object input and return undefined', () => {
		const obj = null;
		expect(getNestedProperty(obj, 'level1.level2' as never)).toBe(undefined);
	});

	it('should handle an object with array values correctly', () => {
		const obj = {
			level1: {
				arr: [1, 2, 3]
			}
		};
		expect(getNestedProperty(obj, 'level1.arr')).toEqual([1, 2, 3]);
	});

	it('should return the correct value for a deeply nested number property', () => {
		const obj = {
			level1: {
				level2: {
					level3: {
						level4: 100
					}
				}
			}
		};
		expect(getNestedProperty(obj, 'level1.level2.level3.level4')).toBe(100);
	});
});
