import { TState } from 'feature-state';
import { TGridRegion } from '../helper';
import { TDimensions, TXYPosition } from './utils';
import { TWidgetGrid } from './widget-grid';

export interface TWidget<GData extends TWidgetBaseData> {
	_widgetGrid: TWidgetGrid<GData, []>;
	id: TWidgetId;
	layoutMode: TState<'Grid' | 'Absolute', []>;
	// nextRegion: TState<TWidgetRegion | null, []>;
	// Widget grid position (region) synced from parent grid, applied when layoutMode is Grid
	region: TState<TGridRegion | null, []>;
	// Absolute position of Widget, applied when layoutMode is Absolute
	position: TState<TXYPosition | null, []>;
	// Absolute size of Widget, applied when layoutMode is Absolute
	size: TState<TDimensions | null, []>;
	// Widget data
	data: TState<GData, []>;
	// Whether the widget is selected, synced from parent selected array
	isSelected: TState<boolean, []>;
	// Whether the widget is locked
	isLocked: TState<boolean, []>;

	syncPosition: () => void;
}

export interface TBaseWidget<GData extends TWidgetBaseData> {
	id: TWidgetId;
	data: GData;
	selected?: boolean;
	locked?: boolean;
}

export type TWidgetId = string;

export type TWidgetBaseData = any;

export interface TWidgetRegionPixels {
	x: number;
	y: number;
	width: number;
	height: number;
}
