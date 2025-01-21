import { getCell } from './get-cell';
import { getGridSize } from './get-grid-size';
import { TGridCellId, TGridCells, TGridPosition, TGridRegion } from './types';

/**
 * Finds a rectangular region from a position by expanding in allowed directions until a condition is met
 */
export function findRegion<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	position: TGridPosition,
	options: TFindRegionMethodOptions = {}
): TGridRegion {
	const {
		isValidCell = (pos) => getCell(cells, pos) === getCell(cells, position),
		directions = {}
	} = options;
	const size = getGridSize(cells);
	const {
		up: upDirection = true,
		down: downDirection = true,
		left: leftDirection = true,
		right: rightDirection = true
	} = directions;
	let left = 0;
	let right = 0;
	let up = 0;
	let down = 0;

	// Expand left until invalid or grid boundary
	if (leftDirection) {
		while (
			position.col - (left + 1) >= 0 &&
			isValidCell({ row: position.row, col: position.col - (left + 1) })
		) {
			left++;
		}
	}

	// Expand right until invalid or grid boundary
	if (rightDirection) {
		while (
			position.col + right + 1 < size.cols &&
			isValidCell({ row: position.row, col: position.col + right + 1 })
		) {
			right++;
		}
	}

	// Expand up until invalid or grid boundary
	if (upDirection) {
		while (position.row - (up + 1) >= 0) {
			let isRowValid = true;
			for (let col = position.col - left; col <= position.col + right; col++) {
				if (!isValidCell({ row: position.row - (up + 1), col })) {
					isRowValid = false;
					break;
				}
			}
			if (!isRowValid) break;
			up++;
		}
	}

	// Expand down until invalid or grid boundary
	if (downDirection) {
		while (position.row + down + 1 < size.rows) {
			let isRowValid = true;
			for (let col = position.col - left; col <= position.col + right; col++) {
				if (!isValidCell({ row: position.row + down + 1, col })) {
					isRowValid = false;
					break;
				}
			}
			if (!isRowValid) break;
			down++;
		}
	}

	return {
		start: {
			row: position.row - up,
			col: position.col - left
		},
		dimension: {
			cols: left + right + 1,
			rows: up + down + 1
		}
	};
}

interface TFindRegionMethodOptions {
	isValidCell?: (position: TGridPosition) => boolean;
	directions?: {
		up?: boolean;
		down?: boolean;
		left?: boolean;
		right?: boolean;
	};
}
