import { notEmpty } from '@blgc/utils';
import { createState } from 'feature-state';
import { createWidget } from './create-widget';
import {
	getGridRegionPixels,
	Grid,
	pointerEventToViewportPoint,
	TGridRegion,
	TGridSize
} from './helper';
import {
	TBaseWidget,
	TBoundingRect,
	TDimensions,
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
		_grid: new Grid(config.grid),
		_size: createState<TGridSize>({ rows: 0, columns: 0 }),
		interactionMode: createState<TInteractionMode>({ type: 'None' }),
		cellSize: createState(config.cellSize),
		boundingRect: createState<TBoundingRect>({ left: 0, top: 0 }),

		init({ baseWidgets }) {
			this._size.set(this._grid.size, { additionalData: { source: 'init' } });

			// Create a map for O(1) lookup of regions by widget ID
			const regions = this._grid.getRegions();
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

		setGridCells(cells) {
			this._grid.cellsState.set(cells);
			this.syncGrid();
		},
		syncGrid(options = {}) {
			const { size = true, regions = true } = options;

			// Sync regions
			if (regions) {
				for (const region of this._grid.getRegions()) {
					const widget = widgetGrid._widgets[region.id];
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
							{ additionalData: { source: 'sync-grid' } }
						);
						const regionPixels = getGridRegionPixels(region, this.cellSize._v);
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
			if (
				size &&
				(this._grid.size.rows !== this._size._v.rows ||
					this._grid.size.columns !== this._size._v.columns)
			) {
				this._size.set(this._grid.size, { additionalData: { source: 'sync-grid' } });
			}
		},

		getWidgetAt(row, col) {
			const id = this._grid.getCellAt(row, col);
			return id != null ? (this._widgets[id] ?? null) : null;
		},
		getWidgetById(id) {
			return this._widgets[id] ?? null;
		},
		getSelectedWidgets() {
			return this._selected._v.map((id) => this._widgets[id]).filter(notEmpty);
		},
		getWidgetRegions() {
			return this._grid.getRegions();
		},
		moveWidget(widgetId, newPosition) {
			const widgetRegion = this.getWidgetById(widgetId)?.region._v;
			if (widgetRegion == null) {
				return;
			}

			const affectedRegions = this._grid.cascadeMove(widgetRegion, newPosition);
			if (affectedRegions.length === 0) {
				return;
			}

			this._grid.cellsState._notify();

			for (const region of affectedRegions) {
				const widget = this.getWidgetById(region.id);
				if (widget == null) {
					continue;
				}
				if (region.id !== widgetId) {
					widget.region.set(region, {
						additionalData: {
							source: 'move-widget'
						}
					});
				} else {
					widget.region._v = region;
				}
			}

			this.syncGrid({ regions: false, size: true });
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
	grid: string[][];
	widgets: TBaseWidget<GContent>[];
	cellSize: TDimensions;
}
