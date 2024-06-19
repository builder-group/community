import { describe, expect, it } from 'vitest';

import { hasProperty } from './has-property';

describe('hasProperty function', () => {
	it('should return true for existing string property', () => {
		const obj = { title: 'Book', pages: 100 };
		expect(hasProperty(obj, 'title')).toBe(true);
	});

	it('should return true for existing number property', () => {
		const obj = { title: 'Book', pages: 100 };
		expect(hasProperty(obj, 'pages')).toBe(true);
	});

	it('should return false for non-existent property', () => {
		const obj = { title: 'Book', pages: 100 };
		expect(hasProperty(obj, 'author')).toBe(false);
	});

	it('should return false when obj is not an object', () => {
		const obj = null;
		expect(hasProperty(obj, 'title')).toBe(false);
	});

	it('should return false for symbol key on non-object', () => {
		const obj = 'string';
		const sym = Symbol('test');
		expect(hasProperty(obj, sym)).toBe(false);
	});

	it('should return true for existing symbol property', () => {
		const sym = Symbol('test');
		const obj = { [sym]: 'value' };
		expect(hasProperty(obj, sym)).toBe(true);
	});

	it('should return false for non-existent symbol property', () => {
		const sym1 = Symbol('test1');
		const sym2 = Symbol('test2');
		const obj = { [sym1]: 'value' };
		expect(hasProperty(obj, sym2)).toBe(false);
	});

	it('should return false for non-existent property on an empty object', () => {
		const obj = {};
		expect(hasProperty(obj, 'nonExistent')).toBe(false);
	});
});
