import { describe, expect, it } from 'vitest';

import { defineConfig } from './define-config';

describe('defineConfig function', () => {
	it('should populate target with default values', () => {
		const target: { a: number; b?: number } = { a: 1 };
		const defaults = { b: 2 };
		const result = defineConfig(target, defaults);
		expect(result).to.deep.equal({ a: 1, b: 2 });
	});

	it('should overwrite undefined properties in target if flag is true', () => {
		const target: { a?: number; b?: number } = { a: undefined };
		const defaults = { a: 1, b: 2 };
		const result = defineConfig(target, defaults, true);
		expect(result).to.deep.equal({ a: 1, b: 2 });
	});

	it('should not overwrite undefined properties in target if flag is false', () => {
		const target: { a?: number; b?: number } = { a: undefined };
		const defaults = { a: 1, b: 2 };
		const result = defineConfig(target, defaults, false);
		expect(result).to.deep.equal({ a: undefined, b: 2 });
	});
});
