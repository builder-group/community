import { TDimensions, TWidgetRegion } from '../types';

export function getRegionPixels(region: TWidgetRegion, cellSize: TDimensions): TRegionPixels {
	return {
		x: region.start.col * cellSize.width,
		y: region.start.row * cellSize.height,
		width: region.dimension.width * cellSize.width,
		height: region.dimension.height * cellSize.height
	};
}

export interface TRegionPixels {
	x: number;
	y: number;
	width: number;
	height: number;
}
