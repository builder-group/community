import { TGridRange, TWidgetRegionWithId } from '../types';

// TODO: Should the specified range be strictly followed or should it consider "overhanging" widgets?
export function getWidgetRegions(grid: string[][], range?: TGridRange): TWidgetRegionWithId[] {
	const rows = grid.length;
	const columns = grid[0]?.length ?? 0;
	if (rows === 0 || columns === 0) {
		return [];
	}

	// Use provided range or full grid
	const computeRange = range ?? {
		start: { row: 0, col: 0 },
		end: { row: rows, col: columns }
	};

	const visitedCells = new Set<string>();
	const regions: TWidgetRegionWithId[] = [];

	// Only compute regions within the specified range
	for (let row = computeRange.start.row; row < computeRange.end.row; row++) {
		for (let col = computeRange.start.col; col < computeRange.end.col; col++) {
			const cellKey = `${row}-${col}`;
			if (visitedCells.has(cellKey)) {
				continue;
			}

			const widgetId = grid[row]?.[col];
			if (widgetId == null || widgetId === '-') {
				visitedCells.add(cellKey);
				continue;
			}

			// Find dimensions within the range
			const width = findMaxWidth(grid, row, col, widgetId, computeRange, visitedCells);
			const height = findMaxHeight(grid, row, col, width, widgetId, computeRange, visitedCells);

			markRegionAsVisited(visitedCells, row, col, width, height);

			regions.push({ widgetId, start: { row, col }, dimension: { width, height } });
		}
	}

	return regions;
}

function findMaxWidth(
	grid: string[][],
	row: number,
	startCol: number,
	widgetId: string,
	range: TGridRange,
	visitedCells: Set<string>
): number {
	let width = 1;
	while (
		startCol + width < range.end.col &&
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
	range: TGridRange,
	visitedCells: Set<string>
): number {
	let height = 1;
	rowLoop: for (let r = startRow + 1; r < range.end.row; r++) {
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
