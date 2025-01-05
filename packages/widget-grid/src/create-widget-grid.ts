import { TWidgetGridBaseItem, TWidgetGridItemId, type TWidgetGrid } from './types';

export function createWidgetGrid<GItem extends TWidgetGridBaseItem>(
	config: TCreateWidgetGridConfig<GItem>
): TWidgetGrid<GItem, []> {
	return {
		_features: [],
		_grid: config.grid,
		_items: config.items,
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
		}
	};
}

export interface TCreateWidgetGridConfig<GItem extends TWidgetGridBaseItem> {
	grid: string[][];
	items: Record<TWidgetGridItemId, GItem>;
}
