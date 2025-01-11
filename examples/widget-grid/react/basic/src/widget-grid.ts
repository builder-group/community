import { createWidgetGrid, TBaseWidget, TWidgetBaseContent, TWidgetGrid } from 'widget-grid';

const createPlaygroundPreset = (): TWidgetGridPreset<TPlaygroundContent> => {
	const initalGrid = [
		['1', '1', '2', '3'],
		['1', '1', '2', '3'],
		['-', '5', '4', '4']
	];

	return {
		grid: createWidgetGrid<TPlaygroundContent>({
			grid: initalGrid,
			widgets: [
				{ id: '1', content: { type: 'item1' } },
				{ id: '2', content: { type: 'item2' } },
				{ id: '3', content: { type: 'item3' } },
				{ id: '4', content: { type: 'item2' } },
				{ id: '5', content: { type: 'item1' } }
			],
			cellSize: { width: 96, height: 96 }
		}),
		actions: [
			{
				label: 'Shuffle',
				action: (widgetGrid) => {
					widgetGrid.grid.set([
						['3', '3', '5', '1'],
						['3', '3', '5', '1'],
						['2', '2', '4', '4']
					]);
				}
			},
			{
				label: 'Reset',
				action: (widgetGrid) => {
					widgetGrid.grid.set(initalGrid);
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

	function shuffleGrid(grid: string[][]): string[][] {
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
		const shuffledGrid: string[][] = [];

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
					widgetGrid.grid.set((grid) => shuffleGrid(grid));
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
