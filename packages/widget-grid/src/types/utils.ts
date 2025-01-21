export interface TBoundingRect {
	left: number;
	top: number;
}

export type TDimensions = {
	width: number;
	height: number;
};

export type TRect = TDimensions & TXYPosition;

export type TXYPosition = {
	x: number;
	y: number;
};

export type TXYZPosition = TXYPosition & {
	z: number;
};

// https://stackoverflow.com/questions/2980763/javascript-objects-get-parent
export type TWithInit<GObject extends object, GArgs = void> = GObject & {
	init: GArgs extends void ? () => GObject : (args: GArgs) => GObject;
};
