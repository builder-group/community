import { findRegion } from './find-region';
import { getCell } from './get-cell';
import { iterateRegion } from './iterate-region';
import { TGridCellId, TGridCells, TGridRegion, TGridRegionWithId } from './types';

/**
 * Returns all regions that occupy any part of the specified region
 */
export function getOccupyingRegions<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region: TGridRegion
): TGridRegionWithId<GGridCellId>[] {
	const occupyingRegions: TGridRegionWithId<GGridCellId>[] = [];
	const processedIds = new Set<GGridCellId>();

	iterateRegion(region, (position) => {
		const cellId = getCell(cells, position);
		if (cellId != null && !processedIds.has(cellId)) {
			processedIds.add(cellId);
			const occupyingRegion = findRegion(cells, position, {
				isValidCell: (pos) => getCell(cells, pos) === cellId
			});
			occupyingRegions.push({
				id: cellId,
				...occupyingRegion
			});
		}
	});

	return occupyingRegions;
}
