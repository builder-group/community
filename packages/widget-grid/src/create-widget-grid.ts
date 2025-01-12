import { notEmpty } from '@blgc/utils';
import { createState } from 'feature-state';
import {
	getGridSize,
	getWidgetRegionPixels,
	getWidgetRegions,
	pointerEventToViewportPoint
} from './helper';
import {
	TBaseWidget,
	TBoundingRect,
	TDimensions,
	TInteractionMode,
	TWidget,
	TWidgetBaseContent,
	TWidgetId,
	TWidgetRegion,
	TXYPosition,
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
			const region = regionsByWidgetId[baseWidget.id] ?? null;
			const regionPixels = region != null ? getWidgetRegionPixels(region, cellSize) : null;
			const widget = {
				id: baseWidget.id,
				content: createState(baseWidget.content as GContent),
				region: createState(region),
				layoutMode: createState<'Grid' | 'Absolute'>('Grid'),
				position: createState<TXYPosition | null>(
					regionPixels != null ? { x: regionPixels.x, y: regionPixels.y } : null
				),
				size: createState<TDimensions | null>(
					regionPixels != null ? { width: regionPixels.width, height: regionPixels.height } : null
				),
				isSelected: createState(baseWidget.selected ?? false),
				isLocked: createState(baseWidget.locked ?? false)
			};

			widget.isSelected.listen(({ value }) => {
				if (value) {
					widget.layoutMode.set('Absolute', { additionalData: { source: 'is-selected' } });
				} else {
					widget.layoutMode.set('Grid', { additionalData: { source: 'is-selected' } });
				}
			});

			acc[baseWidget.id] = widget;

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

	// TODO: Should I work with side effects? Or update e.g. region, position, size, etc. more directly?

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
					const regionPixels = getWidgetRegionPixels(region, cellSize);
					widget.position.set(
						{ x: regionPixels.x, y: regionPixels.y },
						{ additionalData: { ...additionalData, source: 'update-widget-regions' } }
					);
					widget.size.set(
						{ width: regionPixels.width, height: regionPixels.height },
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

	widgetGrid.interactionMode.listen(
		({ value }) => {
			if (value.type === 'None') {
				for (const widget of widgetGrid.getSelectedWidgets()) {
					const region = widget.region._v;
					if (region != null) {
						const regionPixels = getWidgetRegionPixels(region, cellSize);
						widget.position.set({
							x: regionPixels.x,
							y: regionPixels.y
						});
					}
				}
			}
		},
		{ key: 'interaction-mode' }
	);

	return widgetGrid;
}

export interface TCreateWidgetGridConfig<GContent extends TWidgetBaseContent> {
	grid: string[][];
	widgets: TBaseWidget<GContent>[];
	cellSize: TDimensions;
}
