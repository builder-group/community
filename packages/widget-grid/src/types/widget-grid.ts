import { TFeatureDefinition, TWithFeatures } from '@blgc/types/features';
import { TState } from 'feature-state';
import {
	TGridCells,
	TGridDimensions,
	TGridLayout,
	TGridPosition,
	TGridRegion,
	TRegionPixels
} from '../helper';
import { TBoundingRect, TXYPosition } from './utils';
import { TWidget, TWidgetBaseData, TWidgetId } from './widget';

export type TWidgetGrid<
	GData extends TWidgetBaseData,
	GFeatures extends TFeatureDefinition[]
> = TWithFeatures<
	{
		// Stores the widgets within the grid, each identified by a unique ID
		_widgets: Record<TWidgetId, TWidget<GData>>;
		// List of currently selected widget IDs
		_selected: TState<TWidgetId[], []>;
		// 2D array representing the grid layout
		_cells: TState<TGridCells<TWidgetId>, []>;
		_size: TState<TGridDimensions, []>;
		// Mode for user interaction (e.g. Translating, Pressing, etc.)
		interactionMode: TState<TInteractionMode, []>;
		// Size of each cell in the grid
		layout: TState<TGridLayout, []>;
		// Offset of the viewport relative to the window
		boundingRect: TState<TBoundingRect, []>;

		setCells: (cells: (string | null)[][]) => void;
		syncCells: (options?: { size?: boolean; regions?: boolean }) => void;

		getWidgetAt: (position: TGridPosition) => TWidget<GData> | null;
		getWidgetById: (id: string) => TWidget<GData> | null;
		getSelectedWidgets: () => TWidget<GData>[];
		getWidgetRegions: () => TGridRegion[];
		getRegionPixels: (region: TGridRegion) => TRegionPixels;
		moveWidget: (widgetId: string, newPosition: TGridPosition) => void;

		setSelected: (widgetIds: string[]) => void;
		getSelected: () => string[];
		select: (widgetIds: string[], toggle?: boolean) => void;
		unselect: () => void;
		syncSelected: (prevValue: string[]) => void;

		pointerEventToViewportPoint: (pointerEvent: {
			clientX: number;
			clientY: number;
		}) => TXYPosition;
	},
	GFeatures
>;

export type TInteractionMode =
	| TInteractionModeNone
	| TInteractionModeInserting
	| TInteractionModeTranslating
	| TInteractionModeResizing
	| TInteractionModeEditing;

export interface TInteractionModeNone {
	type: 'None';
}

export interface TInteractionModeInserting {
	type: 'Inserting';
	widgetId: TWidgetId;
}

export interface TInteractionModeTranslating {
	type: 'Translating';
	// gridOrigin: TGridPosition;
	// gridCurrent: TGridPosition;
	originPosition: { x: number; y: number };
	currentPosition: { x: number; y: number };
}

export interface TInteractionModeResizing {
	type: 'Resizing';
	handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
}

export interface TInteractionModeEditing {
	type: 'Editing';
}
