import { describe, expect, it } from 'vitest';

import { shallowMerge } from './shallow-merge';

describe('shallowMerge function', () => {
	it('should perform a basic shallow merge', () => {
		const target = { a: 1 };
		const source = { b: 2 };
		const result = shallowMerge(target, source);
		expect(result).to.deep.equal({ a: 1, b: 2 });
	});

	it('should overwrite undefined properties if flag is true', () => {
		const target = { a: undefined };
		const source = { a: 1, b: 2 };
		const result = shallowMerge(target, source, true);
		expect(result).to.deep.equal({ a: 1, b: 2 });
	});

	it('should not overwrite undefined properties if flag is false', () => {
		const target = { a: undefined };
		const source = { a: 1, b: 2 };
		const result = shallowMerge(target, source, false);
		expect(result).to.deep.equal({ a: undefined, b: 2 });
	});
});
