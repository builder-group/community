import { describe, expect, it } from 'vitest';
import { spoolGrid } from './board';

describe('board helpers', () => {
	it('repeats per-column spool definitions when fewer spools than columns are provided', () => {
		const charSpool = [{ type: 'char', value: 'A' }] as const;
		const statusSpool = [{ type: 'char', value: 'B' }] as const;

		expect(spoolGrid([charSpool, statusSpool], 5, 1)).toEqual([
			[charSpool, statusSpool, charSpool, statusSpool, charSpool]
		]);
	});
});
