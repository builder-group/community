import { describe, expect, it } from 'vitest';
import { areJsonValuesEqual, cloneJson, isJsonObject, isJsonValue, type TJsonObject } from './json';

describe('json module', () => {
	describe('isJsonValue function', () => {
		it('should accept nested JSON values', () => {
			expect(
				isJsonValue({
					items: [null, true, 42, 'value', { nested: false }]
				})
			).toBe(true);
		});

		it.each([
			{ name: 'undefined', value: undefined },
			{ name: 'non-finite numbers', value: Number.NaN },
			{ name: 'Date objects', value: new Date() },
			{ name: 'functions', value: () => undefined }
		])('should reject $name', ({ value }) => {
			expect(isJsonValue(value)).toBe(false);
		});

		it('should reject cyclic values', () => {
			const value: Record<string, unknown> = {};
			value['self'] = value;

			expect(isJsonValue(value)).toBe(false);
		});

		it('should reject excessive nesting without overflowing the call stack', () => {
			let value: unknown = null;
			for (let depth = 0; depth < 102; depth += 1) {
				value = { value };
			}

			expect(isJsonValue(value)).toBe(false);
		});

		it.each([
			{ name: 'sparse arrays', value: new Array<unknown>(1) },
			{ name: 'arrays with custom properties', value: Object.assign([null], { extra: true }) }
		])('should reject $name', ({ value }) => {
			expect(isJsonValue(value)).toBe(false);
		});
	});

	describe('isJsonObject function', () => {
		it('should accept objects but reject arrays', () => {
			expect(isJsonObject({ value: true })).toBe(true);
			expect(isJsonObject([true])).toBe(false);
		});
	});

	describe('cloneJson function', () => {
		it('should clone nested values without shared references', () => {
			// Prepare
			const value = {
				items: [{ label: 'Example' }]
			};

			// Act
			const clone = cloneJson(value);

			// Assert
			expect(clone).toEqual(value);
			expect(clone).not.toBe(value);
			expect(clone.items).not.toBe(value.items);
			expect(clone.items[0]).not.toBe(value.items[0]);
		});
	});

	describe('areJsonValuesEqual function', () => {
		it('should compare values structurally regardless of object key order', () => {
			const left = {
				active: true,
				items: [null, { label: 'Example' }]
			};
			const right = {
				items: [null, { label: 'Example' }],
				active: true
			};

			expect(areJsonValuesEqual(left, right)).toBe(true);
		});

		it('should reject structurally different values', () => {
			expect(areJsonValuesEqual({ value: 1 }, { value: 2 })).toBe(false);
		});

		it('should compare only own object properties', () => {
			const left = JSON.parse('{"__proto__":{}}') as TJsonObject;

			expect(areJsonValuesEqual(left, { other: 1 })).toBe(false);
		});
	});
});
