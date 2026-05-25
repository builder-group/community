import { describe, expect, expectTypeOf, it } from 'vitest';
import { deepCopy } from './deep-copy';

describe('deepCopy function', () => {
	describe('types', () => {
		it('should preserve the input value type', () => {
			const value = {
				name: 'Jeff',
				items: [{ count: 1 }]
			};

			const copiedValue = deepCopy(value);

			expectTypeOf(copiedValue).toEqualTypeOf<{
				name: string;
				items: { count: number }[];
			}>();
		});
	});

	describe('plain values', () => {
		it('should return primitive and nullish values unchanged', () => {
			expect(deepCopy('value')).toBe('value');
			expect(deepCopy(42)).toBe(42);
			expect(deepCopy(null)).toBe(null);
			expect(deepCopy(undefined)).toBe(undefined);
		});

		it('should deeply copy plain objects and arrays', () => {
			// Prepare
			const value = {
				name: 'Jeff',
				tags: ['admin'],
				meta: {
					count: 1
				}
			};

			// Act
			const copiedValue = deepCopy(value);
			value.tags.push('editor');
			value.meta.count = 2;

			// Assert
			expect(copiedValue).toEqual({
				name: 'Jeff',
				tags: ['admin'],
				meta: {
					count: 1
				}
			});
			expect(copiedValue).not.toBe(value);
			expect(copiedValue.tags).not.toBe(value.tags);
			expect(copiedValue.meta).not.toBe(value.meta);
		});
	});

	describe('non-plain values', () => {
		it('should return non-plain objects by reference', () => {
			// Prepare
			const date = new Date('2026-01-01T00:00:00.000Z');
			const value = {
				date,
				map: new Map([['name', 'Jeff']])
			};

			// Act
			const copiedValue = deepCopy(value);

			// Assert
			expect(copiedValue).not.toBe(value);
			expect(copiedValue.date).toBe(date);
			expect(copiedValue.map).toBe(value.map);
		});
	});
});
