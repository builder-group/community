import { describe, expect, it } from 'vitest';
import { getCellKey } from './get-cell-key';

describe('getCellKey', () => {
	it('should create unique keys for different positions', () => {
		const keys = new Set([getCellKey(0, 0), getCellKey(0, 1), getCellKey(1, 0), getCellKey(1, 1)]);

		expect(keys.size).toBe(4);
	});

	it('should be consistent for same inputs', () => {
		const key1 = getCellKey(1, 2);
		const key2 = getCellKey(1, 2);
		expect(key1).toBe(key2);
	});
});
