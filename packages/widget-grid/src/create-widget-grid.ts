import { createState } from 'feature-state';
import { getWidgetRegions, pointerEventToViewportPoint } from './helper';
import {
	TBoundingRect,
	TDimensions,
	TInteractionMode,
	TWidget,
	TWidgetId,
	TWidgetRegion,
	type TWidgetGrid
} from './types';

export function createWidgetGrid<GContent>(
	config: TCreateWidgetGridConfig<GContent>
): TWidgetGrid<GContent, []> {
	const { widgets: baseWidgets, grid, cellSize } = config;

	// Create a map for O(1) lookup of regions by widget ID
	const regions = getWidgetRegions(grid);
	const regionsByWidgetId = regions.reduce(
		(acc, region) => {
			acc[region.widgetId] = {
				start: region.start,
				dimension: region.dimension
			};
			return acc;
		},
		{} as Record<TWidgetId, TWidgetRegion>
	);

	// Convert base widgets to full widgets with regions in one pass
	const widgets = baseWidgets.reduce(
		(acc, baseWidget) => {
			acc[baseWidget.id] = {
				id: baseWidget.id,
				content: baseWidget.content,
				region: regionsByWidgetId[baseWidget.id]
			};
			return acc;
		},
		{} as Record<TWidgetId, TWidget<GContent>>
	);

	return {
		_features: [],
		_grid: config.grid,
		_widgets: widgets,
		_selected: createState<TWidgetId[]>([]),
		interactionMode: createState<TInteractionMode>({ mode: 'none' }),
		cellSize: createState(cellSize),
		boundingRect: createState<TBoundingRect>({ left: 0, top: 0 }),
		getSize() {
			return {
				rows: this._grid.length,
				columns: this._grid[0]?.length ?? 0
			};
		},
		getWidgetAt(row: number, col: number): TWidget<GContent> | null {
			const widgetId = this._grid[row]?.[col];
			return widgetId != null ? (this._widgets[widgetId] ?? null) : null;
		},
		getWidgetById(id: TWidgetId): TWidget<GContent> | null {
			return this._widgets[id] ?? null;
		},
		getWidgetRegions(): TWidgetRegion[] {
			return getWidgetRegions(this._grid);
		},
		select(widgetIds) {
			this._selected.set(widgetIds);
		},
		unselect() {
			this._selected.set([]);
		},
		pointerEventToViewportPoint(pointerEvent) {
			return pointerEventToViewportPoint(pointerEvent, this.boundingRect._v);
		}
	};
}

export interface TCreateWidgetGridConfig<GContent> {
	grid: string[][];
	widgets: TWidget<GContent>[];
	cellSize: TDimensions;
}
