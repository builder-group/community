import { alignStrings } from '@blgc/utils';
import { applyCells } from './apply-cells';
import { bubbleRegionsUp } from './bubble-regions-up';
import { canRegionBeMovedToPos } from './can-region-be-moved-to-pos';
import { cellsToString } from './cells-to-string';
import { clearRegion } from './clear-region';
import { createCellsSnapshot } from './create-cells-snapshot';
import { doRegionsOverlap } from './do-regions-overlap';
import { expandCells } from './expand-cells';
import { fillRegion } from './fill-region';
import { getBoundingRegion } from './get-bounding-region';
import { getCell } from './get-cell';
import { getComplementaryRegions } from './get-complementary-regions';
import { getEmptyCells } from './get-empty-cells';
import { getGridSize } from './get-grid-size';
import { getOccupyingRegions } from './get-occupying-regions';
import { getRegionArea } from './get-region-area';
import { getRegionGap } from './get-region-gap';
import { isRegionOutOfBounds } from './is-region-out-of-bounds';
import { iterateRegion } from './iterate-region';
import { mergeAdjacentRegions } from './merge-adjacent-regions';
import { overrideMove } from './override-move';
import { pushRegions } from './push-regions';
import { trimCells } from './trim-cells';
import { TGridCellId, TGridCells, TGridPosition, TGridRegion, TGridRegionWithId } from './types';

/**
 * Moves a region to a new position using a cascade strategy that maintains grid cohesion.
 * This strategy attempts to maintain a compact grid by cascading regions into freed spaces
 * and adjusting positions vertically when needed.
 *
 * Strategy Steps:
 * 1. Clear the source region
 * 2. Fill freed region with adjacent regions that fit
 * 3. Push down regions that block the target position
 * 4. Place the region at target position
 * 5. Bubble up regions where possible to fill gaps
 *
 * TODO: This implementation does not feel as I've imagined.
 * e.g. Sometimes it does funky diagonal jump moves that don't feel "natural"
 * although it theoretically aligns with the "Strategy Steps".
 * Because sometimes a element partially fills the source (freed) region (Step 2)
 * but then gets additionally pushed down (Step 3) or bubbles up (Step 5).
 * like in Test: "[2] should move 1x2 region in east direction and trigger cascade"
 * - B B | - B B | - - - | - A - | C A -
 * - C D | C - D | C - - | C A - | E A -
 * E F G | E F G | E B B | E B B | - B B
 *      |       | - - D | - - D | - F D
 *      |       | - F G | - F G | - - G
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

	// Don't allow placing regions outside the grid in north, east and west direction
	if (
		isRegionOutOfBounds(cells, targetRegion, {
			directionsToCheck: { north: true, east: true, south: false, west: true }
		})
	) {
		return [];
	}

	// TODO: Snapshot cells to avoid applying invalid moves

	const debugStringCells: string[] = [];

	// 1. Clear source region
	clearRegion(cells, sourceRegion);
	debugStringCells.push(cellsToString(cells));

	// 2. Fill freed region with adjacent regions that fit
	movedRegions.push(...fillSourceRegionBySwapping(cells, sourceRegion, targetRegion));
	debugStringCells.push(cellsToString(cells));

	// 3. Push down regions that block the target position
	movedRegions.push(...pushDownOccupyingRegions(cells, targetRegion));
	debugStringCells.push(cellsToString(cells));

	// TODO: Return if target region is still occupied?
	// But then we need to undo all applied moves
	if (getOccupyingRegions(cells, targetRegion).length > 0) {
		console.error('Target region is still occupied. This should not happen!');
	}

	// 4. Place region at target
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
	fillRegion(cells, targetRegion, cell);
	movedRegions.push({ id: cell, ...targetRegion });
	debugStringCells.push(cellsToString(cells));

	// 5. Bubble up regions where possible to fill gaps
	movedRegions.push(...bubbleRegionsUp(cells, { fixedRegionIds: new Set([cell]) }));
	debugStringCells.push(cellsToString(cells));

	// Trim empty rows and columns
	trimCells(cells);

	console.log(alignStrings(debugStringCells, { separator: ' | ' }));

	return movedRegions;
}

export function fillSourceRegionBySwapping<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	targetRegion: TGridRegion
): TGridRegionWithId<GGridCellId>[] {
	const size = getGridSize(cells);
	const cellsSnapshotStart: TGridPosition = { row: 0, col: 0 };
	const cellsSnapshot = createCellsSnapshot(cells, {
		start: cellsSnapshotStart,
		dimension: size
	}); // TODO: Optimize (shrink) snapshot size

	const movedRegions: TGridRegionWithId<GGridCellId>[] = [];
	const complementaryRegions = getComplementaryRegions(sourceRegion, targetRegion);
	const freedRegions = [...complementaryRegions];
	const boundingRegions = getOccupyingRegions(
		cellsSnapshot,
		getBoundingRegion([targetRegion, sourceRegion])
	);

	while (freedRegions.length > 0) {
		const freedRegion = freedRegions.shift();
		if (freedRegion == null) {
			continue;
		}

		const bestMove = findBestSwapMove(cellsSnapshot, targetRegion, freedRegion, boundingRegions);

		// No valid move found for this freed region
		if (bestMove == null) {
			continue;
		}

		// Apply move to cells snapshot
		overrideMove(cellsSnapshot, bestMove.region, bestMove.newPosition);
		movedRegions.push({
			id: bestMove.region.id,
			start: bestMove.newPosition,
			dimension: bestMove.region.dimension
		});

		// Remove best move from occupying region list
		if (bestMove.avoidsTarget) {
			boundingRegions.splice(bestMove.index, 1);
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

	// Apply snapshot to cells
	applyCells(cells, cellsSnapshot, cellsSnapshotStart);

	return movedRegions;
}

function findBestSwapMove<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	targetRegion: TGridRegion,
	freedRegion: TGridRegion,
	boundingRegions: TGridRegionWithId<GGridCellId>[]
): TSwapMove<GGridCellId> | null {
	const possibleMoves: TSwapMove<GGridCellId>[] = [];

	for (const [index, region] of boundingRegions.entries()) {
		// Check all possible positions within freed region
		iterateRegion(freedRegion, (freedPos) => {
			// Try each cell of the region as an anchor point
			iterateRegion(region, (regionPos) => {
				// Calculate where the region would start if this cell was at freedPos
				const startPos: TGridPosition = {
					row: freedPos.row - (regionPos.row - region.start.row),
					col: freedPos.col - (regionPos.col - region.start.col)
				};

				// Validate move
				if (
					!canRegionBeMovedToPos(cells, region, startPos, {
						allowOutOfBounds: { north: false, east: false, south: true, west: false }
					})
				) {
					return;
				}

				const newRegion: TGridRegion = {
					start: startPos,
					dimension: region.dimension
				};

				// Check if move is diagonal
				if (startPos.row !== region.start.row && startPos.col !== region.start.col) {
					return;
				}

				// Check if move helps freeing target region
				if (doRegionsOverlap(newRegion, targetRegion)) {
					return;
				}

				possibleMoves.push({
					index,
					region,
					newPosition: startPos,
					avoidsTarget: !doRegionsOverlap(newRegion, targetRegion),
					distance: getRegionGap(freedRegion, region),
					area: getRegionArea(region)
				});
			});
		});
	}

	// Sort moves by:
	// 1. Target avoidance (prefer moves that avoid target)
	// 2. Distance (prefer closer regions)
	// 3. Region size (prefer larger regions)
	possibleMoves.sort((a, b) => {
		if (a.avoidsTarget !== b.avoidsTarget) {
			return a.avoidsTarget ? -1 : 1;
		}
		if (a.distance !== b.distance) {
			return a.distance - b.distance;
		}
		return b.area - a.area;
	});

	return possibleMoves[0] ?? null;
}

interface TSwapMove<GGridCellId extends TGridCellId> {
	index: number;
	region: TGridRegionWithId<GGridCellId>;
	newPosition: TGridPosition;
	avoidsTarget: boolean;
	distance: number;
	area: number;
}

function pushDownOccupyingRegions<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	targetRegion: TGridRegion
): TGridRegionWithId<GGridCellId>[] {
	let occupyingRegions = getOccupyingRegions(cells, targetRegion);
	const movedRegions: TGridRegionWithId<GGridCellId>[] = [];
	let madeProgress: boolean;

	do {
		madeProgress = false;

		// Find northwesternmost occupying region
		const northWestRegion = occupyingRegions.reduce(
			(nw, region) => {
				if (
					nw == null ||
					region.start.row < nw.start.row ||
					(region.start.row === nw.start.row && region.start.col < nw.start.col)
				) {
					return region;
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
			occupyingRegions = getOccupyingRegions(cells, targetRegion);
		}
	} while (madeProgress && occupyingRegions.length > 0);

	return movedRegions;
}
