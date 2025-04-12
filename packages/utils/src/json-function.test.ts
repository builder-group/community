import { describe, expect, it } from 'vitest';

describe('json-function function', () => {
	it('should execute the function with provided arguments', () => {
		const jsonFunction = {
			args: ['a', 'b'],
			body: 'return a + b;'
		};

		const func = new Function(...jsonFunction.args, jsonFunction.body);
		expect(func).not.toBeNull();
		expect(func(1, 2)).toBe(3);
		expect(func(5, 7)).toBe(12);
	});

	it('should throw an error for invalid function definitions', () => {
		const jsonFunction = {
			args: ['a', 'b'],
			body: 'return a + ;' // Invalid function body
		};

		expect(() => new Function(...jsonFunction.args, jsonFunction.body)).toThrowError();
	});

	it('should handle empty arguments and body gracefully', () => {
		const jsonFunction = {
			args: [],
			body: ''
		};

		const func = new Function(...jsonFunction.args, jsonFunction.body);
		expect(func).not.toBeNull();
		expect(func()).toBeUndefined();
	});
});
