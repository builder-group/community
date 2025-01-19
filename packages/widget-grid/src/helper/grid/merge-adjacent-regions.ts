import { TGridRegion } from './types';

export function mergeAdjacentRegions(regions: TGridRegion[]): void {
	if (regions.length <= 1) {
		return;
	}

	const merged = regions;
	let didMerge: boolean;

	do {
		didMerge = false;
		for (let i = 0; i < merged.length; i++) {
			for (let j = i + 1; j < merged.length; j++) {
				const region1 = merged[i];
				const region2 = merged[j];
				if (region1 == null || region2 == null) continue;

				// Try to merge horizontally
				if (
					region1.dimension.rows === region2.dimension.rows &&
					region1.start.row === region2.start.row &&
					(region1.start.col + region1.dimension.cols === region2.start.col ||
						region2.start.col + region2.dimension.cols === region1.start.col)
				) {
					merged[i] = {
						start: {
							row: region1.start.row,
							col: Math.min(region1.start.col, region2.start.col)
						},
						dimension: {
							rows: region1.dimension.rows,
							cols: region1.dimension.cols + region2.dimension.cols
						}
					};
					merged.splice(j, 1);
					didMerge = true;
					break;
				}

				// Try to merge vertically
				if (
					region1.dimension.cols === region2.dimension.cols &&
					region1.start.col === region2.start.col &&
					(region1.start.row + region1.dimension.rows === region2.start.row ||
						region2.start.row + region2.dimension.rows === region1.start.row)
				) {
					merged[i] = {
						start: {
							row: Math.min(region1.start.row, region2.start.row),
							col: region1.start.col
						},
						dimension: {
							rows: region1.dimension.rows + region2.dimension.rows,
							cols: region1.dimension.cols
						}
					};
					merged.splice(j, 1);
					didMerge = true;
					break;
				}
			}
			if (didMerge) {
				break;
			}
		}
	} while (didMerge);
}
