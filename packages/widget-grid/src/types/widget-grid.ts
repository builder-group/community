import { TFeatureDefinition, TWithFeatures } from '@blgc/types/features';

export type TWidgetGrid<
	GItem extends TWidgetGridBaseItem,
	GFeatures extends TFeatureDefinition[]
> = TWithFeatures<
	{
		_items: Record<TWidgetGridItemId, GItem>;
		_grid: string[][];
		_interactionMode: TInteractionMode;
		getGridSize: () => { rows: number; columns: number };
		getWidgetAt: (row: number, col: number) => GItem | null;
		getWidgetById: (id: string) => GItem | null;
	},
	GFeatures
>;

export type TWidgetGridItemId = string;

export interface TWidgetGridBaseItem {
	id: TWidgetGridItemId;
}

export type TInteractionMode =
	| TInteractionModeNone
	| TInteractionModeInserting
	| TInteractionModeDragging
	| TInteractionModeResizing
	| TInteractionModeEditing;

export interface TInteractionModeNone {
	mode: 'none';
}

export interface TInteractionModeInserting {
	mode: 'inserting';
	widgetId: TWidgetGridItemId;
}

export interface TInteractionModeDragging {
	mode: 'dragging';
	widgetId: TWidgetGridItemId;
}

export interface TInteractionModeResizing {
	mode: 'resizing';
	widgetId: TWidgetGridItemId;
	handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
}

export interface TInteractionModeEditing {
	mode: 'editing';
	widgetId: TWidgetGridItemId;
}
