import { TGridDimensions, TGridPosition, TGridRegion } from './types';

/**
 * Returns a region from a position and optional dimensions
 */
export function posToRegion(
	pos: TGridPosition,
	dimension: TGridDimensions = { rows: 1, cols: 1 }
): TGridRegion {
	return { start: pos, dimension };
}
