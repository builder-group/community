export interface TGridRegion {
	start: TGridPosition;
	dimension: TGridDimensions;
}

export interface TGridRegionWithId<GGridCellId extends TGridCellId> extends TGridRegion {
	id: GGridCellId;
}

export type TGridCells<GGridCellId extends TGridCellId = string> = TGridCell<GGridCellId>[][];
export type TGridCell<GGridCellId extends TGridCellId = string> = GGridCellId | TEmptyGridCell;
export type TEmptyGridCell = null;
export type TGridCellId = string | number;

export type TGridCellKey = `${number}-${number}`;

export interface TGridPosition {
	row: number;
	col: number;
}

export interface TGridDimensions {
	rows: number;
	cols: number;
}

export interface TGridDirections {
	north: boolean;
	east: boolean;
	south: boolean;
	west: boolean;
}
