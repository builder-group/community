import { clearRegion } from './clear-region';
import { doesRegionContainCells } from './does-region-contain-cells';
import { fillRegion } from './fill-region';
import { getRegions } from './get-regions';
import { isRegionEmpty } from './is-region-empty';
import { TGridCellId, TGridCells, TGridRegion, TGridRegionWithId } from './types';

export function bubbleRegionsUp<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	options: TBubbleRegionsUpOptions<GGridCellId> = {}
): TGridRegionWithId<GGridCellId>[] {
	const { fixedRegionIds = new Set() } = options;
	const movedRegions: TGridRegionWithId<GGridCellId>[] = [];
	let madeChanges: boolean;

	do {
		madeChanges = false;

		// Get all regions in the grid, sorted from top to bottom
		const regions = getRegions(cells).sort((a, b) => a.start.row - b.start.row);

		for (const region of regions) {
			// Skip fixed regions and regions at the top row
			if (fixedRegionIds.has(region.id) || region.start.row === 0) {
				continue;
			}

			// Check for empty space above the region
			let maxUpwardMove = 0;
			for (let row = region.start.row - 1; row >= 0; row--) {
				const spaceAbove: TGridRegion = {
					start: { row, col: region.start.col },
					dimension: { rows: 1, cols: region.dimension.cols }
				};

				// Check if we hit a fixed region
				if (
					fixedRegionIds.size > 0 &&
					doesRegionContainCells(cells, spaceAbove, Array.from(fixedRegionIds))
				) {
					break;
				}

				if (isRegionEmpty(cells, spaceAbove)) {
					maxUpwardMove++;
				} else {
					break;
				}
			}

			// If we can move up, do it
			if (maxUpwardMove > 0) {
				const newPosition = {
					row: region.start.row - maxUpwardMove,
					col: region.start.col
				};

				// Move the region up
				clearRegion(cells, region);
				fillRegion(cells, { start: newPosition, dimension: region.dimension }, region.id);

				movedRegions.push({
					id: region.id,
					start: newPosition,
					dimension: region.dimension
				});

				madeChanges = true;
			}
		}
	} while (madeChanges); // Continue until no more moves are possible

	return movedRegions;
}

interface TBubbleRegionsUpOptions<GGridCellId extends TGridCellId> {
	fixedRegionIds?: Set<GGridCellId>;
}
