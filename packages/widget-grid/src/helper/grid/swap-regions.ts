import { applyCells } from './apply-cells';
import { canRegionBeMovedToPos } from './can-region-be-moved-to-pos';
import { clearRegion } from './clear-region';
import { createCellsSnapshot } from './create-cells-snapshot';
import { doRegionsOverlap } from './do-regions-overlap';
import { fillRegion } from './fill-region';
import { getBoundingRegion } from './get-bounding-region';
import { getOccupyingRegions } from './get-occupying-regions';
import { getRegionDirection } from './get-region-direction';
import { TGridCellId, TGridCells, TGridRegion, TGridRegionWithId } from './types';

export function swapRegions<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	sourceRegion: TGridRegion,
	targetRegion: TGridRegion
): boolean {
	if (doRegionsOverlap(sourceRegion, targetRegion)) {
		return false;
	}

	const occupyingSourceRegions = getOccupyingRegions(cells, sourceRegion);
	const occupyingTargetRegions = getOccupyingRegions(cells, targetRegion);
	const cellsSnapshot = createCellsSnapshot(cells);

	// console.log('Initial state:');
	// console.log(cellsToString(cellsSnapshot));

	// Clear both regions before moving
	[...occupyingSourceRegions, ...occupyingTargetRegions].forEach((region) => {
		clearRegion(cellsSnapshot, region);
	});

	// console.log('After clearing regions:');
	// console.log(cellsToString(cellsSnapshot));

	const occupyingSourceBoundingRegion = getBoundingRegion(occupyingSourceRegions);
	const occupyingTargetBoundingRegion = getBoundingRegion(occupyingTargetRegions);

	// Determine offsets based on direction
	const { horizontal: horizontalDirection, vertical: verticalDirection } = getRegionDirection(
		occupyingSourceBoundingRegion,
		occupyingTargetBoundingRegion
	);
	const [sourceColOffset, targetColOffset] = (() => {
		switch (horizontalDirection) {
			case 'west':
				return [
					occupyingTargetBoundingRegion.dimension.cols, // Source moves right by target width
					-occupyingSourceBoundingRegion.dimension.cols // Target moves left by source width
				];
			case 'east':
				return [
					-occupyingTargetBoundingRegion.dimension.cols, // Source moves left by target width
					occupyingSourceBoundingRegion.dimension.cols // Target moves right by source width
				];
			case 'same-column':
				return [0, 0];
		}
	})();
	const [sourceRowOffset, targetRowOffset] = (() => {
		switch (verticalDirection) {
			case 'north':
				return [
					occupyingTargetBoundingRegion.dimension.rows, // Source moves down by target height
					-occupyingSourceBoundingRegion.dimension.rows // Target moves up by source height
				];
			case 'south':
				return [
					-occupyingTargetBoundingRegion.dimension.rows, // Source moves up by target height
					occupyingSourceBoundingRegion.dimension.rows // Target moves down by source height
				];
			case 'same-row':
				return [0, 0];
		}
	})();

	// Move regions
	if (
		!moveRegionsByOffset(cellsSnapshot, occupyingSourceRegions, {
			row: sourceRowOffset,
			col: sourceColOffset
		})
	) {
		// console.log('Failed to move source region:');
		// console.log(cellsToString(cellsSnapshot));
		return false;
	}
	if (
		!moveRegionsByOffset(cellsSnapshot, occupyingTargetRegions, {
			row: targetRowOffset,
			col: targetColOffset
		})
	) {
		// console.log('Failed to move target region:');
		// console.log(cellsToString(cellsSnapshot));
		return false;
	}

	// console.log('After moving regions:');
	// console.log(cellsToString(cellsSnapshot));

	// Apply the changes
	const boundingRegion = getBoundingRegion([...occupyingSourceRegions, ...occupyingTargetRegions]);
	applyCells(cells, cellsSnapshot, boundingRegion.start);
	return true;
}

function moveRegionsByOffset(
	cellsSnapshot: TGridCells<TGridCellId>,
	regions: TGridRegionWithId<TGridCellId>[],
	offset: { row: number; col: number }
): boolean {
	return regions.every((region) => {
		const newPos = {
			row: region.start.row + offset.row,
			col: region.start.col + offset.col
		};

		console.log(region.id, { offset, newPos });

		if (
			!canRegionBeMovedToPos(cellsSnapshot, region, newPos, {
				allowOutOfBounds: { north: false, east: false, south: false, west: false }
			})
		) {
			return false;
		}

		fillRegion(cellsSnapshot, { ...region, start: newPos }, region.id);
		return true;
	});
}
