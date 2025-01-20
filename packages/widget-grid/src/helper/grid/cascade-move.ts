import { applyCells } from './apply-cells';
import { areRegionsAdjacent } from './are-regions-adjacent';
import { bubbleRegionsUp } from './bubble-regions-up';
import { canRegionBeMovedToPos } from './can-region-be-moved-to-pos';
import { clearRegion } from './clear-region';
import { createCellsSnapshot } from './create-cells-snapshot';
import { doRegionsOverlap } from './do-regions-overlap';
import { doesRegionContainCells } from './does-region-contain-cells';
import { fillRegion } from './fill-region';
import { getCell } from './get-cell';
import { getComplementaryRegions } from './get-complementary-regions';
import { getEmptyCells } from './get-empty-cells';
import { getGridSize } from './get-grid-size';
import { getOccupyingRegions } from './get-occupying-regions';
import { getRegionArea } from './get-region-area';
import { iterateRegion } from './iterate-region';
import { mergeAdjacentRegions } from './merge-adjacent-regions';
import { overrideMove } from './override-move';
import { pushRegions } from './push-regions';
import { TGridCellId, TGridCells, TGridPosition, TGridRegion, TGridRegionWithId } from './types';

/**
 * Moves a region to a new position using a cascade strategy that maintains grid cohesion.
 * This strategy attempts to maintain a compact grid by cascading regions into freed spaces
 * and adjusting positions vertically when needed.
 *
 * Strategy Steps:
 * 1. Clear the source region
 * 2. Fill freed region with adjacent regions that fit, only applied if fully filled
 * 3. Push down regions that block the target position
 * 4. Place the region at target position
 * 5. Bubble up regions where possible to fill gaps
 */
export function cascadeMove<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	targetPosition: TGridPosition
): TGridRegionWithId<GGridCellId>[] {
	const cell = getCell(cells, sourceRegion.start);
	if (cell == null) {
		return [];
	}

	const movedRegions: TGridRegionWithId<GGridCellId>[] = [];
	const targetRegion: TGridRegion = {
		start: targetPosition,
		dimension: sourceRegion.dimension
	};

	// Track regions that need to be moved out of the target region
	const occupyingRegions: Map<GGridCellId, TGridRegion> = new Map(
		getOccupyingRegions(cells, targetRegion)
			.filter((region) => region.id !== cell)
			.map((r) => [r.id, { start: r.start, dimension: r.dimension }])
	);

	// 1. Clear source region
	clearRegion(cells, sourceRegion);

	// 2. Fill freed region with adjacent regions that fit, only applied if fully filled
	if (occupyingRegions.size > 0) {
		movedRegions.push(
			...fillSourceRegionBySwapping(cells, sourceRegion, targetRegion, occupyingRegions)
		);
	}

	// 3. Push down regions that block the target position
	if (occupyingRegions.size > 0) {
		movedRegions.push(...pushDownOccupyingRegions(cells, targetRegion, occupyingRegions));
	}

	// TODO: Return if target region is still occupied
	// if (occupyingRegions.size > 0) {
	// 	return [];
	// }

	// 4. Place region at target
	fillRegion(cells, targetRegion, cell);
	movedRegions.push({ id: cell, ...targetRegion });

	// 5. Bubble up regions where possible to fill gaps
	movedRegions.push(...bubbleRegionsUp(cells));

	return movedRegions;
}

export function fillSourceRegionBySwapping<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	targetRegion: TGridRegion,
	occupyingRegions: Map<GGridCellId, TGridRegion>
): TGridRegionWithId<GGridCellId>[] {
	const size = getGridSize(cells);
	const northWestCorner: TGridPosition = {
		col: Math.min(sourceRegion.start.col, targetRegion.start.col),
		row: Math.min(sourceRegion.start.row, targetRegion.start.row)
	};
	const cellsSnapshot = createCellsSnapshot(cells, {
		start: northWestCorner,
		dimension: {
			cols: size.cols - northWestCorner.col,
			rows: size.rows - northWestCorner.row
		}
	});
	const movedRegions: TGridRegionWithId<GGridCellId>[] = [];
	const complementaryRegions = getComplementaryRegions(sourceRegion, targetRegion);
	const freedRegions = [...complementaryRegions];

	while (freedRegions.length > 0) {
		const freedRegion = freedRegions.shift();
		if (freedRegion == null) {
			continue;
		}

		const bestMove = findBestMove(
			cellsSnapshot,
			sourceRegion,
			targetRegion,
			freedRegion,
			Array.from(occupyingRegions, ([id, region]) => ({ id, ...region }))
		);

		// No valid move found for this freed region
		if (bestMove == null) {
			// freedRegions.push(freedRegion); // TODO: Avoid endless loop
			continue;
		}

		// Apply move to cells snapshot
		overrideMove(cellsSnapshot, bestMove.region, bestMove.newPosition);
		movedRegions.push({
			id: bestMove.region.id,
			start: bestMove.newPosition,
			dimension: bestMove.region.dimension
		});

		// Update occupyingRegions - remove if no longer overlapping
		if (bestMove.avoidsTarget) {
			occupyingRegions.delete(bestMove.region.id);
		}

		// Update freed regions
		freedRegions.push(
			// Remaining free regions in current freed region
			...getEmptyCells(cellsSnapshot, freedRegion),
			// Regions freed up from moved region's original position
			...getEmptyCells(cellsSnapshot, bestMove.region).filter(
				(region) => !doRegionsOverlap(region, targetRegion)
			)
		);
		mergeAdjacentRegions(freedRegions);
	}

	// If source region was not fully filled (contains empty cell), return
	if (complementaryRegions.some((r) => doesRegionContainCells(cellsSnapshot, r, [null]))) {
		return [];
	}

	// Apply snapshot to cells
	applyCells(cells, cellsSnapshot, northWestCorner);

	return movedRegions;
}

function findBestMove<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	targetRegion: TGridRegion,
	freedRegion: TGridRegion,
	occupyingRegions: TGridRegionWithId<GGridCellId>[]
): TMove<GGridCellId> | null {
	const possibleMoves: TMove<GGridCellId>[] = [];

	for (const region of occupyingRegions) {
		// Must be adjacent
		const isAdjacent =
			areRegionsAdjacent(freedRegion, region, {
				includeDiagonal: false
			}) || areRegionsAdjacent(sourceRegion, region, { includeDiagonal: false });
		if (!isAdjacent) {
			continue;
		}

		// Check all possible positions within freed region
		iterateRegion(freedRegion, (pos) => {
			// Validate move
			if (!canRegionBeMovedToPos(cells, region, pos)) {
				return;
			}

			const newRegion: TGridRegion = {
				start: pos,
				dimension: region.dimension
			};

			// Check if move helps free target
			const newFreedRegions = getComplementaryRegions(region, newRegion);
			const freesTarget = newFreedRegions.some((r) => doRegionsOverlap(r, targetRegion));
			if (!freesTarget) {
				return;
			}

			possibleMoves.push({
				region,
				newPosition: pos,
				avoidsTarget: !doRegionsOverlap(newRegion, targetRegion)
			});
		});
	}

	// Sort moves by target avoidance first, then region size
	possibleMoves.sort((a, b) => {
		if (a.avoidsTarget !== b.avoidsTarget) {
			return a.avoidsTarget ? -1 : 1;
		}
		return getRegionArea(b.region) - getRegionArea(a.region);
	});

	return possibleMoves[0] ?? null;
}

interface TMove<GGridCellId extends TGridCellId> {
	region: TGridRegionWithId<GGridCellId>;
	newPosition: TGridPosition;
	avoidsTarget: boolean;
}

function pushDownOccupyingRegions<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	targetRegion: TGridRegion,
	occupyingRegions: Map<GGridCellId, TGridRegion>
): TGridRegionWithId<GGridCellId>[] {
	const movedRegions: TGridRegionWithId<GGridCellId>[] = [];
	let madeProgress: boolean;

	do {
		madeProgress = false;

		// Find northwesternmost occupying region
		const northWestRegion = Array.from(occupyingRegions.entries()).reduce(
			(nw, [id, region]) => {
				if (
					nw == null ||
					region.start.row < nw.start.row ||
					(region.start.row === nw.start.row && region.start.col < nw.start.col)
				) {
					return { id, ...region };
				}
				return nw;
			},
			null as TGridRegionWithId<GGridCellId> | null
		);
		if (northWestRegion == null) {
			break;
		}

		// Calculate required push distance to clear target
		const pushDistance =
			targetRegion.start.row + targetRegion.dimension.rows - northWestRegion.start.row;
		if (pushDistance <= 0) {
			break;
		}

		const pushedRegions = pushRegions(cells, northWestRegion, {
			direction: 'South',
			distance: pushDistance,
			allowOutOfBounds: { south: true }
		});

		if (pushedRegions.length > 0) {
			madeProgress = true;
			movedRegions.push(...pushedRegions);

			// Update occupyingRegions - remove if no longer overlapping
			const updatedNorthWestRegion = pushedRegions.find((r) => r.id === northWestRegion.id);
			if (
				updatedNorthWestRegion != null &&
				!doRegionsOverlap(updatedNorthWestRegion, targetRegion)
			) {
				occupyingRegions.delete(northWestRegion.id);
			}
		}
	} while (madeProgress && occupyingRegions.size > 0);

	return movedRegions;
}
