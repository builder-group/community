import { TDimensions, TWidgetRegion, TWidgetRegionPixels } from '../types';

export function getWidgetRegionPixels(
	region: TWidgetRegion,
	cellSize: TDimensions
): TWidgetRegionPixels {
	return {
		x: region.start.col * cellSize.width,
		y: region.start.row * cellSize.height,
		width: region.dimension.width * cellSize.width,
		height: region.dimension.height * cellSize.height
	};
}
