import { TWidgetId, TWidgetRegion } from '../types';

export function rearrangeGrid(config: TRearrangeGridConfig): boolean {
	const { grid, widgetId, targetRegion, expansion } = config;
	const { south = false, east = false } = expansion ?? {};

	const currentRegion = findWidgetRegion(grid, widgetId);
	if (currentRegion == null) {
		return false;
	}

	if (!isWithinBounds(grid, targetRegion, { south, east })) {
		return false;
	}

	ensureGridSize(grid, targetRegion, { south, east });

	const occupyingWidgetId = findOccupyingWidget(grid, targetRegion, widgetId);

	if (occupyingWidgetId == null) {
		moveWidget(grid, currentRegion, targetRegion, widgetId);
		return true;
	}

	const occupyingRegion = findWidgetRegion(grid, occupyingWidgetId);
	if (occupyingRegion == null) {
		return false;
	}

	swapWidgets(grid, currentRegion, targetRegion, widgetId, occupyingWidgetId, occupyingRegion);
	return true;
}

function findWidgetRegion(grid: string[][], widgetId: TWidgetId): TWidgetRegion | null {
	for (let row = 0; row < grid.length; row++) {
		for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
			if (grid[row]?.[col] === widgetId) {
				const { width, height } = measureWidget(grid, widgetId, row, col);
				return { start: { row, col }, dimension: { width, height } };
			}
		}
	}
	return null;
}

function measureWidget(
	grid: string[][],
	widgetId: TWidgetId,
	startRow: number,
	startCol: number
): { width: number; height: number } {
	let width = 0;
	let height = 0;

	while (grid[startRow]?.[startCol + width] === widgetId) width++;
	while (grid[startRow + height]?.[startCol] === widgetId) height++;

	return { width, height };
}

function isWithinBounds(
	grid: string[][],
	region: TWidgetRegion,
	expansion: TExpansionConfig
): boolean {
	const maxRow = expansion.south ? Infinity : grid.length;
	const maxCol = expansion.east ? Infinity : (grid[0]?.length ?? 0);

	return (
		region.start.row >= 0 &&
		region.start.col >= 0 &&
		region.start.row + region.dimension.height <= maxRow &&
		region.start.col + region.dimension.width <= maxCol
	);
}

function ensureGridSize(
	grid: string[][],
	region: TWidgetRegion,
	expansion: TExpansionConfig
): void {
	const requiredRows = region.start.row + region.dimension.height;
	const requiredCols = region.start.col + region.dimension.width;

	if (expansion.south) {
		while (grid.length < requiredRows) {
			grid.push(new Array(grid[0]?.length || 0).fill('-'));
		}
	}

	if (expansion.east) {
		for (const row of grid) {
			while (row.length < requiredCols) {
				row.push('-');
			}
		}
	}
}

function findOccupyingWidget(
	grid: string[][],
	region: TWidgetRegion,
	excludeWidgetId: TWidgetId
): TWidgetId | null {
	for (let row = region.start.row; row < region.start.row + region.dimension.height; row++) {
		for (let col = region.start.col; col < region.start.col + region.dimension.width; col++) {
			const cell = grid[row]?.[col];
			if (cell && cell !== excludeWidgetId && cell !== '-') {
				return cell;
			}
		}
	}
	return null;
}

function moveWidget(
	grid: string[][],
	currentRegion: TWidgetRegion,
	targetRegion: TWidgetRegion,
	widgetId: TWidgetId
): void {
	clearRegion(grid, currentRegion);
	fillRegion(grid, targetRegion, widgetId);
}

function swapWidgets(
	grid: string[][],
	currentRegion: TWidgetRegion,
	targetRegion: TWidgetRegion,
	widgetId: TWidgetId,
	occupyingWidgetId: TWidgetId,
	occupyingRegion: TWidgetRegion
): void {
	clearRegion(grid, currentRegion);
	clearRegion(grid, occupyingRegion);

	fillRegion(
		grid,
		{ start: currentRegion.start, dimension: occupyingRegion.dimension },
		occupyingWidgetId
	);
	fillRegion(grid, targetRegion, widgetId);
}

function clearRegion(grid: string[][], region: TWidgetRegion): void {
	iterateRegion(region, (row, col) => {
		if (grid[row] != null) {
			grid[row][col] = '-';
		}
	});
}

function fillRegion(grid: string[][], region: TWidgetRegion, widgetId: TWidgetId): void {
	iterateRegion(region, (row, col) => {
		if (grid[row] != null) {
			grid[row][col] = widgetId;
		}
	});
}

function iterateRegion(region: TWidgetRegion, callback: (row: number, col: number) => void): void {
	for (let row = region.start.row; row < region.start.row + region.dimension.height; row++) {
		for (let col = region.start.col; col < region.start.col + region.dimension.width; col++) {
			callback(row, col);
		}
	}
}

export interface TRearrangeGridConfig {
	grid: string[][];
	widgetId: TWidgetId;
	targetRegion: TWidgetRegion;
	expansion?: Partial<TExpansionConfig>;
}

// Only south and east expansion make sense in a grid system,
// similar to how spreadsheets work?
// North and west expansion would require shifting all content
// and negative column and row input values.
interface TExpansionConfig {
	south: boolean;
	east: boolean;
}
