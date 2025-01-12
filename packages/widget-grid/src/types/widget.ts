import { TState } from 'feature-state';
import { TDimensions, TXYPosition } from './utils';

export interface TWidget<GContent extends TWidgetBaseContent> {
	// _widgetGrid: TWidgetGrid<GContent, []>;
	id: TWidgetId;
	layoutMode: TState<'Grid' | 'Absolute', []>;
	region: TState<TWidgetRegion | null, []>; // TODO: Make Readonly, is synced from parent
	position: TState<TXYPosition | null, []>; // TODO: Only set if layoutMode is Absolute?
	size: TState<TDimensions | null, []>; // TODO: Only set if layoutMode is Absolute?
	content: TState<GContent, []>;
	isSelected: TState<boolean, []>; // TODO: Make Readonly, is synced from parent
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
