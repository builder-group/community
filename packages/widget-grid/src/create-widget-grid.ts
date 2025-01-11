import { createState } from 'feature-state';
import { getGridSize, getWidgetRegions, pointerEventToViewportPoint } from './helper';
import {
	TBaseWidget,
	TBoundingRect,
	TDimensions,
	TInteractionMode,
	TWidget,
	TWidgetBaseContent,
	TWidgetId,
	TWidgetRegion,
	type TWidgetGrid
} from './types';

export function createWidgetGrid<GContent extends TWidgetBaseContent>(
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
		_widgets: widgets,
		_selected: createState<TWidgetId[]>([]),
		grid: createState(config.grid),
		size: createState(getGridSize(config.grid)),
		interactionMode: createState<TInteractionMode>({ mode: 'none' }),
		cellSize: createState(cellSize),
		boundingRect: createState<TBoundingRect>({ left: 0, top: 0 }),
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

	widgetGrid.grid.listen(
		({ value, ...additionalData }) => {
			const newRegions = getWidgetRegions(value as string[][]);

			newRegions.forEach((region) => {
				const widget = widgetGrid._widgets[region.widgetId];
				if (
					widget != null &&
					(widget.region._v?.start.row !== region.start.row ||
						widget.region._v?.start.col !== region.start.col ||
						widget.region._v?.dimension.width !== region.dimension.width ||
						widget.region._v?.dimension.height !== region.dimension.height)
				) {
					widget.region.set(
						{
							start: region.start,
							dimension: region.dimension
						},
						{ additionalData }
					);
				}
			});
		},
		{ key: 'update-widget-regions' }
	);

	widgetGrid.grid.listen(
		({ value }) => {
			const newSize = getGridSize(value as string[][]);
			if (
				newSize.rows !== widgetGrid.size._v.rows ||
				newSize.columns !== widgetGrid.size._v.columns
			) {
				widgetGrid.size.set(newSize);
			}
		},
		{ key: 'update-grid-size' }
	);

	return widgetGrid;
}

export interface TCreateWidgetGridConfig<GContent extends TWidgetBaseContent> {
	grid: string[][];
	widgets: TBaseWidget<GContent>[];
	cellSize: TDimensions;
}
