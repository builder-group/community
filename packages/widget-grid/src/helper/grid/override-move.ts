import { canRegionBeMovedToPos, TCanRegionBeMovedToPosOptions } from './can-region-be-moved-to-pos';
import { clearRegion } from './clear-region';
import { fillRegion } from './fill-region';
import { getCell } from './get-cell';
import { TGridCellId, TGridCells, TGridPosition, TGridRegion } from './types';

/**
 * Moves a region to a new position using the override strategy.
 * This strategy simply places the region at the target position and leaves an empty space behind.
 */
export function overrideMove<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	targetPosition: TGridPosition,
	options: TOverrideMoveOptions = {}
): boolean {
	const { override = true, outOfBounds } = options;
	const targetRegion: TGridRegion = {
		start: targetPosition,
		dimension: sourceRegion.dimension
	};

	if (!canRegionBeMovedToPos(cells, sourceRegion, targetPosition, { override, outOfBounds })) {
		return false;
	}

	const cell = getCell(cells, sourceRegion.start);
	clearRegion(cells, sourceRegion);
	fillRegion(cells, targetRegion, cell);

	return true;
}

interface TOverrideMoveOptions extends TCanRegionBeMovedToPosOptions {
	// TODO: Add option to expand grid if needed
}
