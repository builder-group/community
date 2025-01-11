import { createState } from 'feature-state';
import { getWidgetRegions, pointerEventToViewportPoint } from './helper';
import {
	TBaseWidget,
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
				content: createState(baseWidget.content as GContent),
				region: createState(regionsByWidgetId[baseWidget.id] ?? null)
			};
			return acc;
		},
		{} as Record<TWidgetId, TWidget<GContent>>
	);

	const widgetGrid: TWidgetGrid<GContent, []> = {
		_features: [],
		grid: createState(config.grid),
		_widgets: widgets,
		_selected: createState<TWidgetId[]>([]),
		interactionMode: createState<TInteractionMode>({ mode: 'none' }),
		cellSize: createState(cellSize),
		boundingRect: createState<TBoundingRect>({ left: 0, top: 0 }),
		getSize() {
			return {
				rows: this.grid._v.length,
				columns: this.grid._v[0]?.length ?? 0
			};
		},
		getWidgetAt(row: number, col: number): TWidget<GContent> | null {
			const widgetId = this.grid._v[row]?.[col];
			return widgetId != null ? (this._widgets[widgetId] ?? null) : null;
		},
		getWidgetById(id: TWidgetId): TWidget<GContent> | null {
			return this._widgets[id] ?? null;
		},
		getWidgetRegions(): TWidgetRegion[] {
			return getWidgetRegions(this.grid._v);
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

	widgetGrid.grid.listen(({ value }) => {
		const newRegions = getWidgetRegions(value as string[][]);

		newRegions.forEach((region) => {
			const widget = widgetGrid._widgets[region.widgetId];
			if (widget) {
				widget.region.set({
					start: region.start,
					dimension: region.dimension
				});
			}
		});
	});

	return widgetGrid;
}

export interface TCreateWidgetGridConfig<GContent> {
	grid: string[][];
	widgets: TBaseWidget<GContent>[];
	cellSize: TDimensions;
}
