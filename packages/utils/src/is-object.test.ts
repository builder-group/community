import { describe, expect, it } from 'vitest';
import { isObject } from './is-object';

describe('isObject function', () => {
	it('should return true for object literals', () => {
		expect(isObject({})).toBeTruthy();
		expect(isObject({ key: 'value' })).toBeTruthy();
	});

	it('should return false for non-object types', () => {
		expect(isObject('string')).toBeFalsy();
		expect(isObject(123)).toBeFalsy();
		expect(isObject(true)).toBeFalsy();
		expect(isObject(undefined)).toBeFalsy();
		expect(isObject(null)).toBeFalsy();
		expect(isObject(Symbol('symbol'))).toBeFalsy();
	});

	it('should return true for object instances', () => {
		expect(isObject(new Date())).toBeTruthy();
		expect(isObject([])).toBeTruthy();
	});

	it('should return false for functions', () => {
		// eslint-disable-next-line func-names, @typescript-eslint/no-empty-function -- Test
		expect(isObject(function () {})).toBeFalsy();
		// eslint-disable-next-line @typescript-eslint/no-empty-function -- Test
		expect(isObject(() => {})).toBeFalsy();
	});
});
