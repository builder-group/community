import { TState } from 'feature-state';
import { TDimensions } from './utils';

export interface TWidget<GContent extends TWidgetBaseContent> {
	id: TWidgetId;
	region: TState<TWidgetRegion | null, []>; // TODO: Make Readonly, is synced by parent
	content: TState<GContent, []>;
	isSelected: TState<boolean, []>; // TODO: Make Readonly, is synced by parent
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
