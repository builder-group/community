import { describe, expect, it } from 'vitest';

import { deepReplaceVar } from './deep-replace-var';

describe('deepReplaceVar function', () => {
	it('should replace placeholders in a nested object structure', () => {
		const originalData = {
			name: 'Alice',
			details: { age: { var: 'AGE_PLACEHOLDER' }, city: 'New York' },
			tags: [{ var: 'AGE_PLACEHOLDER' }, 'student']
		};
		const expectedData = {
			name: 'Alice',
			details: { age: 25, city: 'New York' },
			tags: [25, 'student']
		};
		const newData = deepReplaceVar(originalData, { AGE_PLACEHOLDER: 25 });

		expect(newData).toEqual(expectedData);
	});

	it('should replace placeholders in nested arrays', () => {
		const originalArray = [
			{ var: 'AGE_PLACEHOLDER' },
			[{ var: 'AGE_PLACEHOLDER' }, { key: { var: 'AGE_PLACEHOLDER' } }]
		];
		const expectedArray = [30, [30, { key: 30 }]];
		const newArray = deepReplaceVar(originalArray, { AGE_PLACEHOLDER: 30 });

		expect(newArray).toEqual(expectedArray);
	});

	it('should not mutate the original object', () => {
		const originalData = { id: { var: 'ID_PLACEHOLDER' }, status: 'active' };
		const newData = deepReplaceVar(originalData, { ID_PLACEHOLDER: '12345' });

		expect(originalData.id).toStrictEqual({ var: 'ID_PLACEHOLDER' });
		expect(newData.id).toBe('12345');
	});

	it('should handle objects without the placeholder', () => {
		const originalData = { name: 'Bob', age: 40 };
		const newData = deepReplaceVar(originalData, { AGE_PLACEHOLDER: 30 });

		expect(newData).toEqual(originalData);
	});

	it('should correctly replace values in deeply nested structures', () => {
		const originalData = {
			user: {
				details: {
					age: { var: 'AGE_PLACEHOLDER' },
					education: {
						university: { var: 'UNIVERSITY_PLACEHOLDER' }
					}
				}
			}
		};
		const expectedData = {
			user: {
				details: {
					age: 22,
					education: {
						university: 'Harvard'
					}
				}
			}
		};
		const newData = deepReplaceVar(originalData, {
			AGE_PLACEHOLDER: 22,
			UNIVERSITY_PLACEHOLDER: 'Harvard'
		});

		expect(newData).toEqual(expectedData);
	});

	it('should correctly replace values using dot notation for array indices', () => {
		const originalData = {
			list: [{ var: 'items.0' }, { var: 'items.1' }]
		};
		const expectedData = {
			list: ['apple', 'banana']
		};
		const newData = deepReplaceVar(originalData, {
			items: ['apple', 'banana']
		});

		expect(newData).toEqual(expectedData);
	});

	it('should correctly replace values using dot notation for nested object properties', () => {
		const originalData = {
			user: {
				details: { name: { var: 'user.details.name' }, age: { var: 'user.details.age' } }
			}
		};
		const expectedData = {
			user: {
				details: { name: 'Alice', age: 25 }
			}
		};
		const newData = deepReplaceVar(originalData, {
			user: { details: { name: 'Alice', age: 25 } }
		});

		expect(newData).toEqual(expectedData);
	});
});
