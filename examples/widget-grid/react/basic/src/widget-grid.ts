import { createWidgetGrid, TBaseWidget, TWidgetBaseContent, TWidgetGrid } from 'widget-grid';

const createPlaygroundPreset = (): TWidgetGridPreset<TPlaygroundContent> => {
	const initalGrid = [
		['A', 'B', 'C'],
		['A', 'D', 'E'],
		['F', 'G', 'H']
	];

	return {
		grid: createWidgetGrid<TPlaygroundContent>({
			grid: initalGrid,
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
			cellSize: { width: 96, height: 96 }
		}),
		actions: [
			{
				label: 'Shuffle',
				action: (widgetGrid) => {
					widgetGrid.setGridCells([
						['B', 'B', 'C'],
						['G', 'D', 'E'],
						['H', 'A', 'F']
					]);
				}
			},
			{
				label: 'Reset',
				action: (widgetGrid) => {
					widgetGrid.setGridCells(initalGrid);
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
		grid: string[][];
		widgets: TBaseWidget<TPerformanceContent>[];
	} {
		const grid: string[][] = Array(rows)
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

		return { grid, widgets };
	}

	function shuffleCells(grid: (string | null)[][]): (string | null)[][] {
		// Flatten the grid into a single array
		const flatGrid = grid.flat();

		// Fisher-Yates shuffle algorithm
		for (let i = flatGrid.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[flatGrid[i], flatGrid[j]] = [flatGrid[j], flatGrid[i]];
		}

		// Reconstruct the 2D array
		const rows = grid.length;
		const cols = grid[0].length;
		const shuffledGrid: (string | null)[][] = [];

		for (let i = 0; i < rows; i++) {
			shuffledGrid.push(flatGrid.slice(i * cols, (i + 1) * cols));
		}

		return shuffledGrid;
	}

	const { grid, widgets } = generateTestGrid(cols, rows);

	return {
		grid: createWidgetGrid<TPerformanceContent>({
			grid,
			widgets,
			cellSize: { width: 100, height: 100 }
		}),
		actions: [
			{
				label: 'Shuffle',
				action: (widgetGrid) => {
					widgetGrid.setGridCells(shuffleCells(widgetGrid.grid.cells));
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
