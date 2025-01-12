import { TFeatureDefinition, TWithFeatures } from '@blgc/types/features';
import { TState } from 'feature-state';
import { TBoundingRect, TDimensions, TXYPosition } from './utils';
import { TGridPosition, TWidget, TWidgetBaseContent, TWidgetId, TWidgetRegion } from './widget';

export type TWidgetGrid<
	GContent extends TWidgetBaseContent,
	GFeatures extends TFeatureDefinition[]
> = TWithFeatures<
	{
		// Stores the widgets within the grid, each identified by a unique ID
		_widgets: Record<TWidgetId, TWidget<GContent>>;
		// List of currently selected widget IDs
		_selected: TState<TWidgetId[], []>;
		// 2D array representing the grid layout
		grid: TState<string[][], []>;
		size: TState<TGridSize, []>;
		// Mode for user interaction (e.g. Translating, Pressing, etc.)
		interactionMode: TState<TInteractionMode, []>;
		// Size of each cell in the grid
		cellSize: TState<TDimensions, []>;
		// Offset of the viewport relative to the window
		boundingRect: TState<TBoundingRect, []>;
		getWidgetAt: (row: number, col: number) => TWidget<GContent> | null;
		getWidgetById: (id: string) => TWidget<GContent> | null;
		getSelectedWidgets: () => TWidget<GContent>[];
		getWidgetRegions: () => TWidgetRegion[];
		select: (widgetIds: string[], toggle?: boolean) => void;
		unselect: () => void;
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

export interface TGridRange {
	start: TGridPosition;
	end: TGridPosition;
}

export interface TGridSize {
	rows: number;
	columns: number;
}
