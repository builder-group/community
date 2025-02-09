import { TGridRegion } from './types';

export function getRegionDirection(source: TGridRegion, target: TGridRegion): TRegionDirection {
	return {
		horizontal: getHorizontalDirection(source, target),
		vertical: getVerticalDirection(source, target)
	};
}

export type THorizontalRegionDirection = 'west' | 'east' | 'same-column';
export type TVerticalRegionDirection = 'north' | 'south' | 'same-row';

export type TRegionDirection = {
	horizontal: THorizontalRegionDirection;
	vertical: TVerticalRegionDirection;
};

function getHorizontalDirection(
	source: TGridRegion,
	target: TGridRegion
): THorizontalRegionDirection {
	if (source.start.col === target.start.col) return 'same-column';
	return source.start.col < target.start.col ? 'west' : 'east';
}

function getVerticalDirection(source: TGridRegion, target: TGridRegion): TVerticalRegionDirection {
	if (source.start.row === target.start.row) return 'same-row';
	return source.start.row < target.start.row ? 'north' : 'south';
}
