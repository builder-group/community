import { TGridSize } from '../types';

export function getGridSize(grid: string[][]): TGridSize {
	return {
		rows: grid.length,
		columns: grid[0]?.length ?? 0
	};
}
