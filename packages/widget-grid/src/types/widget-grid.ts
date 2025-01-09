import { TFeatureDefinition, TWithFeatures } from '@blgc/types/features';
import { TGridPosition, TWidget, TWidgetId, TWidgetRegion } from './widget';

export type TWidgetGrid<GContent, GFeatures extends TFeatureDefinition[]> = TWithFeatures<
	{
		_grid: string[][];
		_widgets: Record<TWidgetId, TWidget<GContent>>;
		_selected: TWidgetId[]; // TODO: State?
		interactionMode: TInteractionMode; // TODO: State?
		getSize: () => { rows: number; columns: number };
		getWidgetAt: (row: number, col: number) => TWidget<GContent> | null;
		getWidgetById: (id: string) => TWidget<GContent> | null;
		getWidgetRegions: () => TWidgetRegion[];
		select: (widgetIds: string[]) => void;
		unselect: () => void;
		startTranslating: (widgetId: string, originPosition: { x: number; y: number }) => void;
		updateTranslatePosition: (x: number, y: number) => void;
		endTranslating: () => void;
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
	mode: 'none';
}

export interface TInteractionModeInserting {
	mode: 'inserting';
	widgetId: TWidgetId;
}

export interface TInteractionModeTranslating {
	mode: 'translating';
	// gridOrigin: TGridPosition;
	// gridCurrent: TGridPosition;
	originPosition: { x: number; y: number };
	currentPosition: { x: number; y: number };
}

export interface TInteractionModeResizing {
	mode: 'resizing';
	handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
}

export interface TInteractionModeEditing {
	mode: 'editing';
}

export interface TGridRange {
	start: TGridPosition;
	end: TGridPosition;
}
