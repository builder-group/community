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
