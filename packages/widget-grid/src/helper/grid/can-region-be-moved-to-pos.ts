import { doesRegionConsistOfCells } from './does-region-consist-of-cells';
import { getCell } from './get-cell';
import { isRegionOutOfBounds } from './is-region-out-of-bounds';
import { TGridCellId, TGridCells, TGridDirections, TGridPosition, TGridRegion } from './types';

export function canRegionBeMovedToPos<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	targetPosition: TGridPosition,
	options: TCanRegionBeMovedToPosOptions = {}
): boolean {
	const { override = false, allowOutOfBounds } = options;
	const targetRegion: TGridRegion = {
		start: targetPosition,
		dimension: sourceRegion.dimension
	};

	const cell = getCell(cells, sourceRegion.start);
	return (
		(override || doesRegionConsistOfCells(cells, targetRegion, [null, cell])) &&
		(allowOutOfBounds == null ||
			!isRegionOutOfBounds(cells, targetRegion, { directionsToCheck: allowOutOfBounds }))
	);
}

export interface TCanRegionBeMovedToPosOptions {
	override?: boolean;
	allowOutOfBounds?: Partial<TGridDirections>;
}
