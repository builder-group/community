import { describe, expect, it } from 'vitest';

import { notEmpty } from './not-empty';

describe('notEmpty function', () => {
	it('should return true for non-null and non-undefined values', () => {
		expect(notEmpty('string')).to.be.true;
		expect(notEmpty(0)).toBeTruthy();
		expect(notEmpty([])).toBeTruthy();
		expect(notEmpty({})).toBeTruthy();
	});

	it('should return false for null values', () => {
		expect(notEmpty(null)).toBeFalsy();
	});

	it('should return false for undefined values', () => {
		expect(notEmpty(undefined)).toBeFalsy();
	});

	it('should correctly work in array filters', () => {
		const arr = [1, null, 'string', undefined, 0];
		const filtered = arr.filter(notEmpty);
		expect(filtered).to.deep.equal([1, 'string', 0]);
	});
});
