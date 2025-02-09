import { canRegionBeMovedToPos, TCanRegionBeMovedToPosOptions } from './can-region-be-moved-to-pos';
import { clearRegion } from './clear-region';
import { expandCells } from './expand-cells';
import { fillRegion } from './fill-region';
import { getCell } from './get-cell';
import { isRegionOutOfBounds } from './is-region-out-of-bounds';
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
	const { override = true, allowOutOfBounds: outOfBounds } = options;
	const cell = getCell(cells, sourceRegion.start);
	if (cell == null) {
		return false;
	}

	const targetRegion: TGridRegion = {
		start: targetPosition,
		dimension: sourceRegion.dimension
	};

	if (
		!canRegionBeMovedToPos(cells, sourceRegion, targetPosition, {
			override,
			allowOutOfBounds: outOfBounds
		})
	) {
		return false;
	}

	if (
		isRegionOutOfBounds(cells, targetRegion, {
			directionsToCheck: { north: false, east: true, south: true, west: false }
		})
	) {
		expandCells(cells, {
			strategy: 'Set',
			rows: targetPosition.row + sourceRegion.dimension.rows,
			cols: targetPosition.col + sourceRegion.dimension.cols
		});
	}

	clearRegion(cells, sourceRegion);
	fillRegion(cells, targetRegion, cell);

	return true;
}

interface TOverrideMoveOptions extends TCanRegionBeMovedToPosOptions {}
