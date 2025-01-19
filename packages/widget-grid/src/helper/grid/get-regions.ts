import { findRegion } from './find-region';
import { getCell } from './get-cell';
import { getCellKey } from './get-cell-key';
import { getGridSize } from './get-grid-size';
import { iterateRegion } from './iterate-region';
import { TGridCellId, TGridCellKey, TGridCells, TGridRegion, TGridRegionWithId } from './types';

export function getRegions<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	options: TGetRegionsOptions = {}
): TGridRegionWithId<GGridCellId>[] {
	const { rows, cols } = getGridSize(cells);
	if (rows === 0 || cols === 0) {
		return [];
	}

	const { region: computeRegion = { start: { row: 0, col: 0 }, dimension: { rows, cols } } } =
		options;

	const visitedCells = new Set<TGridCellKey>();
	const regions: TGridRegionWithId<GGridCellId>[] = [];

	// Calculate end positions for bounds checking
	const endRow = computeRegion.start.row + computeRegion.dimension.rows;
	const endCol = computeRegion.start.col + computeRegion.dimension.cols;

	// Only compute regions within the specified range
	iterateRegion(computeRegion, (pos) => {
		const cellKey = getCellKey(pos.row, pos.col);
		if (visitedCells.has(cellKey)) {
			return;
		}

		const cellId = getCell(cells, pos);
		if (cellId == null) {
			visitedCells.add(cellKey);
			return;
		}

		const region = findRegion(cells, pos, {
			directions: {
				right: true,
				down: true
			},
			isValidCell: ({ row: r, col: c }) => {
				// Check bounds
				if (
					r < computeRegion.start.row ||
					r >= endRow ||
					c < computeRegion.start.col ||
					c >= endCol
				) {
					return false;
				}

				const key = getCellKey(r, c);
				if (visitedCells.has(key)) {
					return false;
				}

				return cells[r]?.[c] === cellId;
			}
		});

		iterateRegion(region, (pos) => {
			visitedCells.add(getCellKey(pos.row, pos.col));
		});

		regions.push({
			id: cellId,
			...region
		});
	});

	return regions;
}

interface TGetRegionsOptions {
	region?: TGridRegion;
}
