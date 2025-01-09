import { getWidgetRegions } from './helper';
import { TWidgetGridBaseItem, TWidgetGridItemId, TWidgetRegion, type TWidgetGrid } from './types';

export function createWidgetGrid<GItem extends TWidgetGridBaseItem>(
	config: TCreateWidgetGridConfig<GItem>
): TWidgetGrid<GItem, []> {
	return {
		_features: [],
		_grid: config.grid,
		_items: config.items,
		_interactionMode: {
			mode: 'none'
		},
		getGridSize() {
			return {
				rows: this._grid.length,
				columns: this._grid[0]?.length ?? 0
			};
		},
		getWidgetAt(row: number, col: number): GItem | null {
			const widgetId = this._grid[row]?.[col];
			return widgetId != null ? (this._items[widgetId] ?? null) : null;
		},
		getWidgetById(id: TWidgetGridItemId): GItem | null {
			return this._items[id] ?? null;
		},
		getWidgetRegions(): TWidgetRegion[] {
			return getWidgetRegions(this._grid);
		}
	};
}

export interface TCreateWidgetGridConfig<GItem extends TWidgetGridBaseItem> {
	grid: string[][];
	items: Record<TWidgetGridItemId, GItem>;
}
