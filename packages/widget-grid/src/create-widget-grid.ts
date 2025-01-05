import { type TWidgetData, type TWidgetGrid, type TWidgetGridData } from './types';

export function createWidgetGrid(data: TWidgetGridData): TWidgetGrid<[]> {
	return {
		_features: [],
		_data: data,
		getDimensions() {
			return {
				width: this._data.columns * 96,
				height: this._data.rows * 96
			};
		},
		getWidgetAt(row: number, col: number): TWidgetData | null {
			const widgetId = this._data.grid[row]?.[col];
			return widgetId ? (this._data.widgets[widgetId] as TWidgetData) : null;
		},
		getWidgetById(id: string): TWidgetData | null {
			return this._data.widgets[id] as TWidgetData | null;
		}
	};
}
