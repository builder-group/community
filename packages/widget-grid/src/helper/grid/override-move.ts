import { clearRegion } from './clear-region';
import { fillRegion } from './fill-region';
import { getCell } from './get-cell';
import { isRegionAllowedCells } from './is-region-allowed-cells';
import { TGridCellId, TGridCells, TGridPosition, TGridRegion } from './types';

/**
 * Moves a region to a new position using the override strategy.
 * This strategy simply places the region at the target position and leaves an empty space behind.
 */
export function overrideMove<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	currentRegion: TGridRegion,
	targetPosition: TGridPosition,
	options: TOverrideMoveOptions = {}
): boolean {
	const { override = true } = options;
	const targetRegion: TGridRegion = {
		start: targetPosition,
		dimension: currentRegion.dimension
	};

	const cell = getCell(cells, currentRegion.start);
	if (!override && !isRegionAllowedCells(cells, targetRegion, [null, cell])) {
		return false;
	}

	clearRegion(cells, currentRegion);
	fillRegion(cells, targetRegion, cell);

	return true;
}

interface TOverrideMoveOptions {
	override?: boolean;
}
