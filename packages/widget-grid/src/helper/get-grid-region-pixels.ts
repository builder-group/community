import { TDimensions, TWidgetRegionPixels } from '../types';
import { TGridRegion } from './grid';

export function getGridRegionPixels(
	region: TGridRegion,
	cellSize: TDimensions
): TWidgetRegionPixels {
	return {
		x: region.start.col * cellSize.width,
		y: region.start.row * cellSize.height,
		width: region.dimension.width * cellSize.width,
		height: region.dimension.height * cellSize.height
	};
}
