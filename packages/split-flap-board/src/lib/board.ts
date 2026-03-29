import { charSpool } from '../spools/presets';
import type { TFlapChar, TSpool } from '../types';

/**
 * Fill a uniform 2-D spool grid.
 *
 * Pass a single `TSpool` to use the same flap set for every cell, or a `TSpool[]`
 * (one spool per column, cycled) to vary the flap set by column.
 *
 * @param spool - Single spool or one spool per column.
 * @param cols  - Number of columns.
 * @param rows  - Number of rows.
 */
export function spoolGrid(spool: TSpool | TSpool[], cols: number, rows: number): TSpool[][] {
	const isPerColumn = spool.length > 0 && Array.isArray(spool[0]);
	const colSpools: TSpool[] = isPerColumn
		? (spool as TSpool[])
		: Array.from({ length: cols }, () => spool as TSpool);

	return Array.from({ length: rows }, () =>
		Array.from({ length: cols }, (_, c) => colSpools[c % colSpools.length] ?? charSpool)
	);
}

/**
 * Convert lines of text into a `{ spools, grid }` pair ready for `<split-flap-board>`.
 *
 * Each line can be a plain string or `{ text, bg?, color? }`. Text is uppercased
 * and padded/truncated to `cols` characters to match the default `charSpool` key set.
 *
 * @param lines - Text lines to display.
 * @param cols  - Board width in columns.
 */
export function fromLines(
	lines: TLineInput[],
	cols: number
): { spools: TSpool[][]; grid: string[][] } {
	const spools: TSpool[][] = [];
	const grid: string[][] = [];

	for (const line of lines) {
		const isObj = typeof line === 'object';
		const text = isObj ? line.text : line;
		const bg = isObj ? line.bg : undefined;
		const color = isObj ? line.color : undefined;

		const padded = text.toUpperCase().padEnd(cols, ' ').slice(0, cols);
		const chars = padded.split('');

		if (bg != null || color != null) {
			// Bake the per-line colours into each cell's spool so all flaps share the same bg/color.
			const rowSpools: TSpool[] = chars.map(() =>
				charSpool.map((flap): TFlapChar => {
					if (flap.type !== 'char') return flap as unknown as TFlapChar;
					return {
						...flap,
						...(bg != null ? { bg } : {}),
						...(color != null ? { color } : {})
					};
				})
			);
			spools.push(rowSpools);
		} else {
			spools.push(Array.from({ length: cols }, () => charSpool));
		}

		grid.push(chars);
	}

	return { spools, grid };
}

export type TLineInput = string | { text: string; bg?: string; color?: string };
