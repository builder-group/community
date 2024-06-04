import { describe, expect, it } from 'vitest';

import { pickProperties } from './pick-properties';

describe('pickProperties function', () => {
	it('should correctly extract specified properties from an object', () => {
		const obj: { name: string; age?: number; active: boolean } = {
			name: 'John',
			age: 30,
			active: true
		};
		const picked = pickProperties(obj, ['name', 'age']);
		expect(picked).toEqual({ name: 'John', age: 30 });
	});

	it('should ignore non-existing properties', () => {
		const obj = { name: 'John', age: 30 };
		const picked = pickProperties(obj, ['name', 'location'] as any);
		expect(picked).toEqual({ name: 'John' });
	});

	it('should return an empty object if no properties match', () => {
		const obj = { name: 'John', age: 30 };
		const picked = pickProperties(obj, ['height', 'weight'] as any);
		expect(picked).toEqual({});
	});
});
