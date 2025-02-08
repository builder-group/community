import {
	createWidgetGrid,
	TBaseWidget,
	TGridCells,
	TWidgetBaseData,
	TWidgetGrid,
	TWidgetId
} from 'widget-grid';

const createPlaygroundPreset = (): TWidgetGridPreset<TPlaygroundData> => {
	const initialCells: TGridCells<TWidgetId> = [
		['A', 'B', 'B'],
		['A', 'C', 'D'],
		['E', 'F', 'G']
		// ['A', 'B', 'C'],
		// ['A', 'D', 'E'],
		// ['F', 'G', 'H']
	];

	return {
		grid: createWidgetGrid<TPlaygroundData>({
			cells: initialCells,
			widgets: [
				{ id: 'A', data: { type: 'item1' } },
				{ id: 'B', data: { type: 'item2' } },
				{ id: 'C', data: { type: 'item3' } },
				{ id: 'D', data: { type: 'item2' } },
				{ id: 'E', data: { type: 'item1' } },
				{ id: 'F', data: { type: 'item2' } },
				{ id: 'G', data: { type: 'item3' } },
				{ id: 'H', data: { type: 'item2' } }
			],
			layout: { cell: { width: 96, height: 96 }, gap: { width: 0, height: 0 } }
		}),
		actions: [
			{
				label: 'Shuffle',
				action: (widgetGrid) => {
					widgetGrid.setCells([
						['B', 'B', 'C'],
						['G', 'D', 'E'],
						['H', 'A', 'F']
					]);
				}
			},
			{
				label: 'Reset',
				action: (widgetGrid) => {
					widgetGrid.setCells(initialCells);
				}
			}
		]
	};
};

interface TWidgetData1 {
	type: 'item1';
}

interface TWidgetData2 {
	type: 'item2';
}

interface TWidgetData3 {
	type: 'item3';
}

type TPlaygroundData = TWidgetData1 | TWidgetData2 | TWidgetData3;

const createPerformancePreset = (cols = 50, rows = 50): TWidgetGridPreset<TPerformanceData> => {
	function generateTestGrid(
		rows: number,
		columns: number
	): {
		cells: TGridCells<TWidgetId>;
		widgets: TBaseWidget<TPerformanceData>[];
	} {
		const cells: TGridCells<TWidgetId> = Array(rows)
			.fill(null)
			.map((_, row) =>
				Array(columns)
					.fill(null)
					.map((_, col) => `w${row * columns + col}`)
			);

		const widgets: TBaseWidget<TPerformanceData>[] = Array(rows * columns)
			.fill(null)
			.map((_, index) => ({
				id: `w${index}`,
				data: {
					type: 'test',
					data: `Widget ${index}`
				}
			}));

		return { cells, widgets };
	}

	function shuffleCells(cells: TGridCells<TWidgetId>): TGridCells<TWidgetId> {
		// Flatten the grid into a single array
		const flatGrid = cells.flat();

		// Fisher-Yates shuffle algorithm
		for (let i = flatGrid.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[flatGrid[i], flatGrid[j]] = [flatGrid[j], flatGrid[i]];
		}

		// Reconstruct the 2D array
		const rows = cells.length;
		const cols = cells[0].length;
		const shuffledCells: TGridCells<TWidgetId> = [];

		for (let i = 0; i < rows; i++) {
			shuffledCells.push(flatGrid.slice(i * cols, (i + 1) * cols));
		}

		return shuffledCells;
	}

	const { cells, widgets } = generateTestGrid(cols, rows);

	return {
		grid: createWidgetGrid<TPerformanceData>({
			cells,
			widgets,
			layout: { cell: { width: 100, height: 100 }, gap: { width: 0, height: 0 } }
		}),
		actions: [
			{
				label: 'Shuffle',
				action: (widgetGrid) => {
					widgetGrid.setCells(shuffleCells(widgetGrid._cells._v));
				}
			}
		]
	};
};

// Create presets
export const widgetGridPresets = {
	playground: createPlaygroundPreset(),
	performance: createPerformancePreset(20, 20)
} as const;

export type TWidgetGridPresetKey = keyof typeof widgetGridPresets;

interface TPerformanceData extends TWidgetBaseData {
	type: 'test';
	data: string;
}

interface TPresetAction<T extends TWidgetBaseData> {
	label: string;
	action: (widgetGrid: TWidgetGrid<T, []>) => void;
}

interface TWidgetGridPreset<T extends TWidgetBaseData> {
	grid: TWidgetGrid<T, []>;
	actions: TPresetAction<T>[];
}
