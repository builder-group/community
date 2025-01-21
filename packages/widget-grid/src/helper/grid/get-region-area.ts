import { TGridRegion } from './types';

export function getRegionArea(region: TGridRegion): number {
	return region.dimension.rows * region.dimension.cols;
}
