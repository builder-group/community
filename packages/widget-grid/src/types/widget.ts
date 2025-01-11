import { TState } from 'feature-state';
import { TDimensions } from './utils';

export interface TWidget<GContent> {
	id: TWidgetId;
	region: TState<TWidgetRegion | null, []>; // TODO: State
	content: TState<GContent, []>; // TODO: State
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
	dimension: TDimensions;
}

export interface TWidgetRegionWithId extends TWidgetRegion {
	widgetId: TWidgetId;
}

export interface TGridPosition {
	row: number;
	col: number;
}
