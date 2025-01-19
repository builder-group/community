import { isRegionAllowedCells } from './is-region-allowed-cells';
import { iterateRegion } from './iterate-region';
import { TGridCell, TGridCellId, TGridCells, TGridRegion } from './types';

/**
 * Fills the specified region with the given ID
 */
export function fillRegion<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	targetRegion: TGridRegion,
	value: TGridCell<GGridCellId>,
	options: TFillRegionOptions = {}
): boolean {
	const { override = true } = options;

	if (!override && !isRegionAllowedCells(cells, targetRegion, [null, value])) {
		return false;
	}

	iterateRegion(targetRegion, ({ row, col }) => {
		if (cells[row] != null) {
			cells[row][col] = value;
		}
	});

	return true;
}

interface TFillRegionOptions {
	override?: boolean;
}
