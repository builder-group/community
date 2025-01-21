import { TGridCellId, TGridCells, TGridPosition } from './types';

export function getCell<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	position: TGridPosition
): GGridCellId | null {
	return cells[position.row]?.[position.col] ?? null;
}
