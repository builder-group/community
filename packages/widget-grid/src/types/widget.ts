import { TState } from 'feature-state';
import { TDimensions, TXYPosition } from './utils';

export interface TWidget<GContent extends TWidgetBaseContent> {
	// _widgetGrid: TWidgetGrid<GContent, []>;
	id: TWidgetId;
	layoutMode: TState<'Grid' | 'Absolute', []>;
	// nextRegion: TState<TWidgetRegion | null, []>;
	// Widget grid position (region) synced from parent grid, applied when layoutMode is Grid
	region: TState<TWidgetRegion | null, []>;
	// Absolute position of Widget, applied when layoutMode is Absolute
	position: TState<TXYPosition | null, []>;
	// Absolute size of Widget, applied when layoutMode is Absolute
	size: TState<TDimensions | null, []>;
	// Widget content
	content: TState<GContent, []>;
	// Whether the widget is selected, synced from parent selected array
	isSelected: TState<boolean, []>;
	// Whether the widget is locked
	isLocked: TState<boolean, []>;
}

export interface TBaseWidget<GContent extends TWidgetBaseContent> {
	id: TWidgetId;
	content: GContent;
	selected?: boolean;
	locked?: boolean;
}

export type TWidgetId = string;

export type TWidgetBaseContent = any;

export interface TWidgetRegion {
	start: TGridPosition;
	dimension: TDimensions;
}

export interface TWidgetRegionWithId extends TWidgetRegion {
	widgetId: TWidgetId;
}

export interface TGridPosition {
	row: number;
	col: number;
}

export interface TWidgetRegionPixels {
	x: number;
	y: number;
	width: number;
	height: number;
}
