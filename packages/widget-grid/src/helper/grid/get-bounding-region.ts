import { TGridRegion } from './types';

/**
 * Returns the smallest region that contains all input regions
 */
export function getBoundingRegion(regions: TGridRegion[]): TGridRegion {
	if (regions.length === 0) {
		return {
			start: {
				row: 0,
				col: 0
			},
			dimension: {
				cols: 0,
				rows: 0
			}
		};
	}

	let minRow = Infinity;
	let minCol = Infinity;
	let maxRow = -Infinity;
	let maxCol = -Infinity;

	for (const region of regions) {
		minRow = Math.min(minRow, region.start.row);
		minCol = Math.min(minCol, region.start.col);
		maxRow = Math.max(maxRow, region.start.row + region.dimension.rows);
		maxCol = Math.max(maxCol, region.start.col + region.dimension.cols);
	}

	return {
		start: {
			row: minRow,
			col: minCol
		},
		dimension: {
			cols: maxCol - minCol,
			rows: maxRow - minRow
		}
	};
}
