import { getGridSize } from './get-grid-size';
import { TGridCellId, TGridCells, TGridDirections, TGridRegion } from './types';

export function isRegionOutOfBounds<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region: TGridRegion,
	options: TIsRegionOutOfBoundsOptions = {}
): boolean {
	const { directionsToCheck = {} } = options;
	const { north = true, east = true, south = true, west = true } = directionsToCheck;
	const size = getGridSize(cells);

	return (
		(north && region.start.row < 0) ||
		(east && region.start.col + region.dimension.cols > size.cols) ||
		(south && region.start.row + region.dimension.rows > size.rows) ||
		(west && region.start.col < 0)
	);
}

export interface TIsRegionOutOfBoundsOptions {
	directionsToCheck?: Partial<TGridDirections>;
}
