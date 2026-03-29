import { charSpool } from '../spools/presets';
import type { TBoardData, TFlap, TLineConfig, TLineInput, TSpool } from '../types';

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
	const columnSpools = isColumnSpoolList(spool) ? spool : [spool];

	return Array.from({ length: rows }, () =>
		Array.from({ length: cols }, (_, columnIndex) => {
			return columnSpools[columnIndex % columnSpools.length] ?? charSpool;
		})
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
export function fromLines(lines: TLineInput[], cols: number): TBoardData {
	const spools: TSpool[][] = [];
	const grid: string[][] = [];

	for (const line of lines) {
		const normalizedLine = normalizeLine(line);
		const row = normalizeText(normalizedLine.text, cols).split('');
		const hasCustomStyle = normalizedLine.bg != null || normalizedLine.color != null;

		spools.push(
			hasCustomStyle
				? createStyledRowSpools(cols, normalizedLine)
				: createRowSpools(charSpool, cols)
		);
		grid.push(row);
	}

	return { spools, grid };
}

function isColumnSpoolList(spool: TSpool | TSpool[]): spool is TSpool[] {
	return Array.isArray(spool[0]);
}

function createRowSpools(spool: TSpool, cols: number): TSpool[] {
	return Array.from({ length: cols }, () => spool);
}

function withLineStyle(flap: TFlap, line: TLineConfig): TFlap {
	if (flap.type !== 'char') {
		return flap;
	}

	return {
		...flap,
		...(line.bg != null ? { bg: line.bg } : {}),
		...(line.color != null ? { color: line.color } : {})
	};
}

function normalizeLine(line: TLineInput): TLineConfig {
	return typeof line === 'string' ? { text: line } : line;
}

function normalizeText(text: string, cols: number): string {
	return text.toUpperCase().padEnd(cols, ' ').slice(0, cols);
}

function createStyledRowSpools(cols: number, line: TLineConfig): TSpool[] {
	const styledSpool = charSpool.map((flap) => withLineStyle(flap, line));
	return createRowSpools(styledSpool, cols);
}
