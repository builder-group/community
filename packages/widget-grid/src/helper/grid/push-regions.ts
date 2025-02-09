import { expandCells } from './expand-cells';
import { getGridSize } from './get-grid-size';
import { getOccupyingRegions } from './get-occupying-regions';
import { overrideMove } from './override-move';
import {
	TGridCellId,
	TGridCells,
	TGridDirection,
	TGridDirections,
	TGridRegion,
	TGridRegionWithId
} from './types';

/**
 * Pushes regions in a specified direction, moving all affected regions
 */
export function pushRegions<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	options: TPushRegionsOptions
): TGridRegionWithId<GGridCellId>[] {
	const {
		direction,
		distance,
		allowOutOfBounds = { north: false, east: true, south: true, west: false }
	} = options;
	if (distance <= 0) {
		return [];
	}

	switch (direction) {
		case 'South':
			return pushRegionsSouth(cells, sourceRegion, distance, allowOutOfBounds.south === true);
		default:
			return [];
	}
}

function pushRegionsSouth<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	distance: number,
	allowOutOfBounds: boolean
): TGridRegionWithId<GGridCellId>[] {
	const size = getGridSize(cells);
	const regionsToMove = findSouthRegionsToMove(cells, {
		start: {
			row: sourceRegion.start.row,
			col: sourceRegion.start.col
		},
		dimension: {
			rows: size.rows - sourceRegion.start.row,
			cols: sourceRegion.dimension.cols
		}
	});

	if (!regionsToMove.length) {
		return [];
	}

	// Sort regions from north to south
	// to identify the last region to move
	// and to avoid moving regions on top of each other
	regionsToMove.sort((a, b) => b.start.row - a.start.row);

	// Calculate required grid size
	const lastRegionToMove = regionsToMove[0] as TGridRegion;
	const maxRowNeeded = lastRegionToMove.start.row + lastRegionToMove.dimension.rows + distance;

	// Expand grid if needed
	if (maxRowNeeded > size.rows) {
		if (!allowOutOfBounds) {
			return [];
		}
		expandCells(cells, { rows: maxRowNeeded, strategy: 'Set' });
	}

	// Move each region
	const movedRegions: TGridRegionWithId<GGridCellId>[] = [];
	for (const region of regionsToMove) {
		const newPosition = {
			row: region.start.row + distance,
			col: region.start.col
		};
		overrideMove(cells, region, newPosition);
		movedRegions.push({
			...region,
			start: newPosition
		});
	}

	return movedRegions;
}

function findSouthRegionsToMove<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	initialCol: TGridRegion
): TGridRegionWithId<GGridCellId>[] {
	const processedCols = new Map<number, number>(); // col -> starting row where it's affected
	const affectedRegions: Map<GGridCellId, TGridRegion> = new Map();
	const colsToProcess: TGridRegion[] = [initialCol];

	while (colsToProcess.length > 0) {
		const affectedRegion = colsToProcess.shift();
		if (affectedRegion == null) {
			continue;
		}

		// Mark columns of affected region as processed
		for (
			let col = affectedRegion.start.col;
			col < affectedRegion.start.col + affectedRegion.dimension.cols;
			col++
		) {
			processedCols.set(col, affectedRegion.start.row);
		}

		const affectedRegionsInCol = getOccupyingRegions(cells, affectedRegion);

		// Sort by row to process south to north
		// to find the highest row of a potential new affected col
		affectedRegionsInCol.sort((a, b) => a.start.row - b.start.row);

		for (const region of affectedRegionsInCol) {
			if (!affectedRegions.has(region.id)) {
				affectedRegions.set(region.id, region);
			}

			// Check if region spans outside current affected columns
			for (let col = region.start.col; col < region.start.col + region.dimension.cols; col++) {
				const existingAffectedRow = processedCols.get(col);

				// Skip if column is already affected from a higher or same row
				if (existingAffectedRow != null && existingAffectedRow <= region.start.row) {
					continue;
				}

				// Mark column as affected from this row down
				colsToProcess.push({
					start: {
						row: region.start.row,
						col
					},
					dimension: {
						rows: affectedRegion.dimension.rows - (region.start.row - affectedRegion.start.row),
						cols: 1
					}
				});
			}
		}
	}

	return Array.from(affectedRegions, ([id, region]) => ({
		...region,
		id
	}));
}

interface TPushRegionsOptions {
	distance: number;
	direction: Extract<TGridDirection, 'South'>;
	allowOutOfBounds?: Partial<TGridDirections>;
}
