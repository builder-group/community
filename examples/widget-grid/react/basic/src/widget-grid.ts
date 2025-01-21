import {
	createWidgetGrid,
	TBaseWidget,
	TGridCells,
	TWidgetBaseContent,
	TWidgetGrid,
	TWidgetId
} from 'widget-grid';

const createPlaygroundPreset = (): TWidgetGridPreset<TPlaygroundContent> => {
	const initialCells: TGridCells<TWidgetId> = [
		['A', 'B', 'B'],
		['A', 'C', 'D'],
		['E', 'F', 'G']
		// ['A', 'B', 'C'],
		// ['A', 'D', 'E'],
		// ['F', 'G', 'H']
	];

	return {
		grid: createWidgetGrid<TPlaygroundContent>({
			cells: initialCells,
			widgets: [
				{ id: 'A', content: { type: 'item1' } },
				{ id: 'B', content: { type: 'item2' } },
				{ id: 'C', content: { type: 'item3' } },
				{ id: 'D', content: { type: 'item2' } },
				{ id: 'E', content: { type: 'item1' } },
				{ id: 'F', content: { type: 'item2' } },
				{ id: 'G', content: { type: 'item3' } },
				{ id: 'H', content: { type: 'item2' } }
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

interface TWidgetContent1 {
	type: 'item1';
}

interface TWidgetContent2 {
	type: 'item2';
}

interface TWidgetContent3 {
	type: 'item3';
}

type TPlaygroundContent = TWidgetContent1 | TWidgetContent2 | TWidgetContent3;

const createPerformancePreset = (cols = 50, rows = 50): TWidgetGridPreset<TPerformanceContent> => {
	function generateTestGrid(
		rows: number,
		columns: number
	): {
		cells: TGridCells<TWidgetId>;
		widgets: TBaseWidget<TPerformanceContent>[];
	} {
		const cells: TGridCells<TWidgetId> = Array(rows)
			.fill(null)
			.map((_, row) =>
				Array(columns)
					.fill(null)
					.map((_, col) => `w${row * columns + col}`)
			);

		const widgets: TBaseWidget<TPerformanceContent>[] = Array(rows * columns)
			.fill(null)
			.map((_, index) => ({
				id: `w${index}`,
				content: {
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
		grid: createWidgetGrid<TPerformanceContent>({
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

interface TPerformanceContent extends TWidgetBaseContent {
	type: 'test';
	data: string;
}

interface TPresetAction<T extends TWidgetBaseContent> {
	label: string;
	action: (widgetGrid: TWidgetGrid<T, []>) => void;
}

interface TWidgetGridPreset<T extends TWidgetBaseContent> {
	grid: TWidgetGrid<T, []>;
	actions: TPresetAction<T>[];
}
