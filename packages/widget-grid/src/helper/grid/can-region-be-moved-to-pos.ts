import { doesRegionConsistOfCells } from './does-region-consist-of-cells';
import { getCell } from './get-cell';
import { isRegionOutOfBounds, TIsRegionOutOfBoundsOptions } from './is-region-out-of-bounds';
import { TGridCellId, TGridCells, TGridPosition, TGridRegion } from './types';

export function canRegionBeMovedToPos<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	targetPosition: TGridPosition,
	options: TCanRegionBeMovedToPosOptions = {}
): boolean {
	const { override = false, outOfBounds } = options;
	const targetRegion: TGridRegion = {
		start: targetPosition,
		dimension: sourceRegion.dimension
	};

	const cell = getCell(cells, sourceRegion.start);
	return (
		(override || doesRegionConsistOfCells(cells, targetRegion, [null, cell])) &&
		(outOfBounds == null || !isRegionOutOfBounds(cells, targetRegion, outOfBounds))
	);
}

export interface TCanRegionBeMovedToPosOptions {
	override?: boolean;
	outOfBounds?: TIsRegionOutOfBoundsOptions;
}
