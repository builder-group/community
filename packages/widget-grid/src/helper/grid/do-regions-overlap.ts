import { TGridRegion } from './types';

export function doRegionsOverlap(region1: TGridRegion, region2: TGridRegion): boolean {
	return !(
		region1.start.row + region1.dimension.rows <= region2.start.row ||
		region1.start.row >= region2.start.row + region2.dimension.rows ||
		region1.start.col + region1.dimension.cols <= region2.start.col ||
		region1.start.col >= region2.start.col + region2.dimension.cols
	);
}
