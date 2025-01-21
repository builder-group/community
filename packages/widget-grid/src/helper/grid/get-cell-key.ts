import { TGridCellKey } from './types';

export function getCellKey(row: number, col: number): TGridCellKey {
	return `${row}-${col}`;
}
