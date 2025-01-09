import { TWidgetRegion } from '../types';

export function getWidgetRegions(grid: string[][]): TWidgetRegion[] {
	const rows = grid.length;
	const columns = grid[0]?.length ?? 0;
	if (rows === 0 || columns === 0) {
		return [];
	}

	const visitedCells = new Set<string>();
	const regions: TWidgetRegion[] = [];

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < columns; col++) {
			const cellKey = `${row}-${col}`;
			if (visitedCells.has(cellKey)) {
				continue;
			}

			const widgetId = grid[row]?.[col];
			if (widgetId == null || widgetId === '-') {
				visitedCells.add(cellKey);
				continue;
			}

			// Find maximum possible dimensions
			const maxWidth = findMaxWidth(grid, row, col, widgetId, columns, visitedCells);
			const maxHeight = findMaxHeight(grid, row, col, maxWidth, widgetId, rows, visitedCells);

			// Mark region as visited
			markRegionAsVisited(visitedCells, row, col, maxWidth, maxHeight);

			regions.push({
				widgetId,
				startRow: row,
				startCol: col,
				width: maxWidth,
				height: maxHeight
			});
		}
	}

	return regions;
}

function findMaxWidth(
	grid: string[][],
	row: number,
	startCol: number,
	widgetId: string,
	maxColumns: number,
	visitedCells: Set<string>
): number {
	let width = 1;
	while (
		startCol + width < maxColumns &&
		grid[row]?.[startCol + width] === widgetId &&
		!visitedCells.has(`${row}-${startCol + width}`)
	) {
		width++;
	}
	return width;
}

function findMaxHeight(
	grid: string[][],
	startRow: number,
	startCol: number,
	width: number,
	widgetId: string,
	maxRows: number,
	visitedCells: Set<string>
): number {
	let height = 1;
	rowLoop: for (let r = startRow + 1; r < maxRows; r++) {
		for (let c = startCol; c < startCol + width; c++) {
			if (grid[r]?.[c] !== widgetId || visitedCells.has(`${r}-${c}`)) {
				break rowLoop;
			}
		}
		height++;
	}
	return height;
}

function markRegionAsVisited(
	visitedCells: Set<string>,
	startRow: number,
	startCol: number,
	width: number,
	height: number
): void {
	for (let r = startRow; r < startRow + height; r++) {
		for (let c = startCol; c < startCol + width; c++) {
			visitedCells.add(`${r}-${c}`);
		}
	}
}
