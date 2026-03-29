import { describe, expect, it } from 'vitest';
import { fromLines, spoolGrid } from './board';

describe('board helpers', () => {
	it('repeats per-column spool definitions when fewer spools than columns are provided', () => {
		const charSpool = [{ type: 'char', value: 'A' }] as const;
		const statusSpool = [{ type: 'char', value: 'B' }] as const;

		expect(spoolGrid([charSpool, statusSpool], 5, 1)).toEqual([
			[charSpool, statusSpool, charSpool, statusSpool, charSpool]
		]);
	});

	it('normalizes text rows to uppercase fixed-width grids', () => {
		expect(fromLines(['ab', 'longer'], 4).grid).toEqual([
			['A', 'B', ' ', ' '],
			['L', 'O', 'N', 'G']
		]);
	});

	it('applies row colors by cloning the shared character spool once per row', () => {
		const { spools } = fromLines([{ text: 'ok', bg: '#111', color: '#fff' }], 2);

		expect(spools[0]).toHaveLength(2);
		expect(spools[0]?.[0]).toBe(spools[0]?.[1]);
		expect(spools[0]?.[0]?.[0]).toMatchObject({
			type: 'char',
			value: ' ',
			bg: '#111',
			color: '#fff'
		});
	});
});
