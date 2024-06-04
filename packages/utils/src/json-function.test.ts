import { describe, expect, it } from 'vitest';

import { toFunction } from './json-function';

describe('toFunction', () => {
	it('should execute the function with provided arguments', () => {
		const jsonFunction = {
			args: ['a', 'b'],
			body: 'return a + b;'
		};

		const func = toFunction(jsonFunction);
		expect(func).not.toBeNull();
		expect(func(1, 2)).toBe(3);
		expect(func(5, 7)).toBe(12);
	});

	it('should throw an error for invalid function definitions', () => {
		const jsonFunction = {
			args: ['a', 'b'],
			body: 'return a + ;' // Invalid function body
		};

		expect(() => toFunction(jsonFunction)).toThrowError();
	});

	it('should handle empty arguments and body gracefully', () => {
		const jsonFunction = {
			args: [],
			body: ''
		};

		const func = toFunction(jsonFunction);
		expect(func).not.toBeNull();
		expect(func()).toBeUndefined();
	});
});
