import { notEmpty } from '@blgc/utils';
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
				region: createState(regionsByWidgetId[baseWidget.id] ?? null),
				isSelected: createState(baseWidget.selected ?? false),
				isLocked: createState(baseWidget.locked ?? false)
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
		interactionMode: createState<TInteractionMode>({ type: 'None' }),
		cellSize: createState(cellSize),
		boundingRect: createState<TBoundingRect>({ left: 0, top: 0 }),
		getWidgetAt(row, col) {
			const widgetId = this.grid._v[row]?.[col];
			return widgetId != null ? (this._widgets[widgetId] ?? null) : null;
		},
		getWidgetById(id) {
			return this._widgets[id] ?? null;
		},
		getSelectedWidgets() {
			return this._selected._v.map((id) => this._widgets[id]).filter(notEmpty);
		},
		getWidgetRegions() {
			return getWidgetRegions(this.grid._v);
		},
		select(widgetIds: TWidgetId[], toggle = false) {
			if (!toggle) {
				this._selected.set(widgetIds);
				return;
			}

			// In toggle mode, compute the new selection state
			const newSelection = [...this._selected._v];

			widgetIds.forEach((id) => {
				const currentIndex = newSelection.indexOf(id);
				// Add if not already selected
				if (currentIndex === -1) {
					newSelection.push(id);
				}
				// Remove if already selected
				else {
					newSelection.splice(currentIndex, 1);
				}
			});

			this._selected.set(newSelection);
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
						{ additionalData: { ...additionalData, source: 'update-widget-regions' } }
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
				widgetGrid.size.set(newSize, { additionalData: { source: 'update-grid-size' } });
			}
		},
		{ key: 'update-grid-size' }
	);

	widgetGrid._selected.listen(
		({ value, prevValue }) => {
			// Unselect widgets that were removed from selection
			prevValue?.forEach((widgetId) => {
				if (!value.includes(widgetId)) {
					const widget = widgetGrid._widgets[widgetId];
					if (widget != null) {
						widget.isSelected.set(false, {
							additionalData: { source: 'update-selected-widgets' }
						});
					}
				}
			});

			// Select newly added widgets
			value.forEach((widgetId) => {
				if (!prevValue?.includes(widgetId)) {
					const widget = widgetGrid._widgets[widgetId];
					if (widget != null) {
						widget.isSelected.set(true, {
							additionalData: { source: 'update-selected-widgets' }
						});
					}
				}
			});
		},
		{
			key: 'update-selected-widgets'
		}
	);

	return widgetGrid;
}

export interface TCreateWidgetGridConfig<GContent extends TWidgetBaseContent> {
	grid: string[][];
	widgets: TBaseWidget<GContent>[];
	cellSize: TDimensions;
}
