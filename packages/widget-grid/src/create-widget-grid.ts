import { notEmpty } from '@blgc/utils';
import { createState } from 'feature-state';
import { createWidget } from './create-widget';
import {
	cascadeMove,
	getCell,
	getGridSize,
	getRegionPixels,
	getRegions,
	pointerEventToViewportPoint,
	TGridCells,
	TGridDimensions,
	TGridLayout,
	TGridRegion
} from './helper';
import {
	TBaseWidget,
	TBoundingRect,
	TInteractionMode,
	TWidget,
	TWidgetBaseContent,
	TWidgetId,
	TWithInit,
	type TWidgetGrid
} from './types';

export function createWidgetGrid<GContent extends TWidgetBaseContent>(
	config: TCreateWidgetGridConfig<GContent>
): TWidgetGrid<GContent, []> {
	const widgetGrid: TWithInit<
		TWidgetGrid<GContent, []>,
		{ baseWidgets: TCreateWidgetGridConfig<GContent>['widgets'] }
	> = {
		_features: [],
		_widgets: {},
		_selected: createState<TWidgetId[]>([]),
		_cells: createState<TGridCells<TWidgetId>>(config.cells),
		_size: createState<TGridDimensions>({ rows: 0, cols: 0 }),
		interactionMode: createState<TInteractionMode>({ type: 'None' }),
		layout: createState(config.layout),
		boundingRect: createState<TBoundingRect>({ left: 0, top: 0 }),

		init({ baseWidgets }) {
			this._size.set(getGridSize(this._cells._v), { additionalData: { source: 'init' } });

			// Create a map for O(1) lookup of regions by widget ID
			const regions = getRegions(this._cells._v);
			const regionsByWidgetId = regions.reduce(
				(acc, region) => {
					acc[region.id] = {
						start: region.start,
						dimension: region.dimension
					};
					return acc;
				},
				{} as Record<TWidgetId, TGridRegion>
			);

			// Convert base widgets to full widgets with regions in one pass
			this._widgets = baseWidgets.reduce(
				(acc, baseWidget) => {
					acc[baseWidget.id] = createWidget({
						baseWidget,
						widgetGrid: this,
						region: regionsByWidgetId[baseWidget.id]
					});
					return acc;
				},
				{} as Record<TWidgetId, TWidget<GContent>>
			);

			// TODO: Should I work with side effects? Or update e.g. region, position, size, etc. more directly?

			this.interactionMode.listen(
				({ value }) => {
					if (value.type === 'None') {
						for (const widget of widgetGrid.getSelectedWidgets()) {
							widget.syncPosition();
						}
					}
				},
				{ key: 'interaction-mode' }
			);

			// @ts-expect-error -- Remove init method after initialization
			delete this.init;
			return this;
		},

		setCells(cells) {
			this._cells.set(cells);
			this.syncCells();
		},
		syncCells(options = {}) {
			const { size = true, regions = true } = options;

			// Sync regions
			if (regions) {
				for (const region of getRegions(this._cells._v)) {
					const widget = this._widgets[region.id];
					if (
						widget != null &&
						(widget.region._v?.start.row !== region.start.row ||
							widget.region._v?.start.col !== region.start.col ||
							widget.region._v?.dimension.cols !== region.dimension.cols ||
							widget.region._v?.dimension.rows !== region.dimension.rows)
					) {
						widget.region.set(
							{
								start: region.start,
								dimension: region.dimension
							},
							{ additionalData: { source: 'sync-grid' } }
						);
						const regionPixels = this.getRegionPixels(region);
						widget.position.set(
							{ x: regionPixels.x, y: regionPixels.y },
							{ additionalData: { source: 'sync-grid' } }
						);
						widget.size.set(
							{ width: regionPixels.width, height: regionPixels.height },
							{ additionalData: { source: 'sync-grid' } }
						);
					}
				}
			}

			// Sync size
			const gridSize = getGridSize(this._cells._v);
			if (size && (gridSize.rows !== this._size._v.rows || gridSize.cols !== this._size._v.cols)) {
				this._size.set(gridSize, { additionalData: { source: 'sync-grid' } });
			}
		},

		getWidgetAt(position) {
			const id = getCell(this._cells._v, position);
			return id != null ? (this._widgets[id] ?? null) : null;
		},
		getWidgetById(id) {
			return this._widgets[id] ?? null;
		},
		getSelectedWidgets() {
			return this._selected._v.map((id) => this._widgets[id]).filter(notEmpty);
		},
		getWidgetRegions() {
			return getRegions(this._cells._v);
		},
		getRegionPixels(region) {
			return getRegionPixels(region, this.layout._v);
		},
		moveWidget(widgetId, newPosition) {
			const widgetRegion = this.getWidgetById(widgetId)?.region._v;
			if (widgetRegion == null) {
				return;
			}

			const affectedRegions = cascadeMove(this._cells._v, widgetRegion, newPosition);
			if (affectedRegions.length === 0) {
				return;
			}

			this._cells._notify();

			for (const region of affectedRegions) {
				const widget = this.getWidgetById(region.id);
				if (widget == null) {
					continue;
				}
				widget.region.set(region, {
					additionalData: {
						source: 'move-widget',
						isMoved: region.id === widgetId
					}
				});
			}

			this.syncCells({ regions: false, size: true });
		},

		setSelected(widgetIds) {
			const prevValue = this._selected._v;
			this._selected.set(widgetIds);
			this.syncSelected(prevValue);
		},
		getSelected() {
			return this._selected._v;
		},
		select(widgetIds: TWidgetId[], toggle = false) {
			if (!toggle) {
				this.setSelected(widgetIds);
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

			this.setSelected(newSelection);
		},
		unselect() {
			this.setSelected([]);
		},
		syncSelected(prevValue) {
			// Unselect widgets that were removed from selection
			prevValue?.forEach((widgetId) => {
				if (!this._selected._v.includes(widgetId)) {
					const widget = widgetGrid._widgets[widgetId];
					if (widget != null) {
						widget.isSelected.set(false, {
							additionalData: { source: 'sync-selected' }
						});
					}
				}
			});

			// Select newly added widgets
			this._selected._v.forEach((widgetId) => {
				if (!prevValue?.includes(widgetId)) {
					const widget = widgetGrid._widgets[widgetId];
					if (widget != null) {
						widget.isSelected.set(true, {
							additionalData: { source: 'sync-selected' }
						});
					}
				}
			});
		},

		pointerEventToViewportPoint(pointerEvent) {
			return pointerEventToViewportPoint(pointerEvent, this.boundingRect._v);
		}
	};

	return widgetGrid.init({ baseWidgets: config.widgets });
}

export interface TCreateWidgetGridConfig<GContent extends TWidgetBaseContent> {
	cells: TGridCells<TWidgetId>;
	widgets: TBaseWidget<GContent>[];
	layout: TGridLayout;
}
