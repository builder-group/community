export interface TWidget<GContent> {
	id: TWidgetId;
	region?: TWidgetRegion; // TODO: State
	content: GContent; // TODO: State
	// isSelected: boolean; // TODO: State
	// isLocked: boolean; // TODO: State
}

export interface TBaseWidget<GContent> {
	id: TWidgetId;
	content: GContent;
	// selected?: boolean;
	// locked?: boolean;
}

export type TWidgetId = string;

export interface TWidgetRegion {
	start: TGridPosition;
	dimension: TGridDimension;
}

export interface TWidgetRegionWithId extends TWidgetRegion {
	widgetId: TWidgetId;
}

export interface TGridPosition {
	row: number;
	col: number;
}

export interface TGridDimension {
	width: number;
	height: number;
}
