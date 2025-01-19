import { TDimensions } from '../../types';
import { TGridRegion } from './types';

export function getRegionPixels(
	region: TGridRegion,
	options: TGetRegionPixelsOptions = {}
): TRegionPixels {
	const { cell = { width: 1, height: 1 }, gap = { width: 0, height: 0 } } = options;

	if (region.dimension.rows === 0 || region.dimension.cols === 0) {
		return {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		};
	}

	return {
		x: region.start.col * cell.width, // No gap applied here to keep the outer edge intact
		y: region.start.row * cell.height, // No gap applied here to keep the outer edge intact
		width: region.dimension.cols * cell.width + (region.dimension.cols - 1) * gap.width, // Gaps between columns
		height: region.dimension.rows * cell.height + (region.dimension.rows - 1) * gap.height // Gaps between rows
	};
}

interface TGetRegionPixelsOptions {
	cell?: TDimensions;
	gap?: TDimensions;
}

export interface TRegionPixels {
	x: number;
	y: number;
	width: number;
	height: number;
}
