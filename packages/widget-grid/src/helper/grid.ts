export class Grid<GGridCellContent extends TGridCellContent = string> {
	private grid: (GGridCellContent | null)[][];
	private config: TGridConfig;

	/**
	 * Creates a new Grid with optional initial content and configuration
	 * @example
	 * const grid = new Grid([['A', 'B'], ['C', 'D']])
	 * const expandableGrid = new Grid([], { expansion: { south: true, east: true } })
	 */
	constructor(grid: (GGridCellContent | TEmptyGridCell)[][] = [[]], options: TGridOptions = {}) {
		this.config = {
			expansion: {
				south: false,
				east: false
			},
			...options
		};
		this.grid = grid;
	}

	/**
	 * Current dimensions of the grid
	 * @example
	 * const { rows, columns } = grid.dimensions // { rows: 2, columns: 3 }
	 */
	public get dimensions(): { rows: number; columns: number } {
		return {
			rows: this.grid.length,
			columns: this.grid[0]?.length ?? 0
		};
	}

	/**
	 * Read-only access to grid content
	 * @example
	 * const cells = grid.cells // [['A', 'B'], ['C', null]]
	 */
	public get cells(): ReadonlyArray<ReadonlyArray<GGridCellContent | TEmptyGridCell>> {
		return this.grid; // .map((row) => [...row]);
	}

	/**
	 * Moves content from one region to another, clearing the source region
	 * @example
	 * // Before: [['A', 'A'], ['-', '-']]
	 * grid.moveRegion(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   { start: { row: 1, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   'A'
	 * )
	 * // After: [['-', '-'], ['A', 'A']]
	 */
	public moveRegion(
		currentRegion: TGridRegion,
		targetRegion: TGridRegion,
		content: GGridCellContent
	): void {
		this.clearRegion(currentRegion);
		this.fillRegion(targetRegion, content);
	}

	/**
	 * Swaps content between two regions while maintaining their original shapes
	 * @example
	 * // Before: [['A', 'A', 'B'], ['A', 'A', 'B']]
	 * grid.swapRegions(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 2 } }, // 2x2 'A' region
	 *   { start: { row: 0, col: 2 }, dimension: { width: 1, height: 2 } }, // 1x2 'B' region
	 *   'A', 'B'
	 * )
	 * // After: [['B', 'B', 'A'], ['B', 'B', 'A']]
	 */
	public swapRegions(
		region1: TGridRegion,
		region2: TGridRegion,
		content1: GGridCellContent,
		content2: GGridCellContent
	): void {
		this.clearRegion(region1);
		this.clearRegion(region2);
		this.fillRegion(region1, content2);
		this.fillRegion(region2, content1);
	}

	/**
	 * Sets all cells in the specified region to null
	 * @example
	 * // Before: [['A', 'A'], ['B', 'B']]
	 * grid.clearRegion({ start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } })
	 * // After: [[null, null], ['B', 'B']]
	 */
	public clearRegion(region: TGridRegion): void {
		this.iterateRegion(region, (row, col) => {
			if (this.grid[row] != null) {
				this.grid[row][col] = null;
			}
		});
	}

	/**
	 * Fills the specified region with content
	 * @example
	 * // Before: [[null, null], ['B', 'B']]
	 * grid.fillRegion(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   'A'
	 * )
	 * // After: [['A', 'A'], ['B', 'B']]
	 */
	public fillRegion(region: TGridRegion, content: GGridCellContent): void {
		this.iterateRegion(region, (row, col) => {
			if (this.grid[row] != null) {
				this.grid[row][col] = content;
			}
		});
	}

	/**
	 * Iterates over each cell in the specified region
	 * @example
	 * grid.iterateRegion(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 2 } },
	 *   (row, col) => console.log(row, col)
	 * )
	 * // Logs: 0,0 -> 0,1 -> 1,0 -> 1,1
	 */
	private iterateRegion(region: TGridRegion, callback: (row: number, col: number) => void): void {
		for (let row = region.start.row; row < region.start.row + region.dimension.height; row++) {
			for (let col = region.start.col; col < region.start.col + region.dimension.width; col++) {
				callback(row, col);
			}
		}
	}

	/**
	 * String representation of the grid, using '-' for empty cells
	 * @example
	 * // grid.cells = [['A', null], [null, 'B']]
	 * grid.toString() // 'A -\n- B'
	 */
	public toString(): string {
		return this.grid
			.map((row) => row.map((cell) => (cell == null ? '-' : cell)).join(' '))
			.join('\n');
	}
}

interface TGridConfig {
	maxRows?: number;
	maxColumns?: number;
	expansion: TGridExpansionConfig;
}

type TGridOptions = Partial<TGridConfig>;

interface TGridRegion {
	start: { row: number; col: number };
	dimension: { width: number; height: number };
}

type TEmptyGridCell = null;
type TGridCellContent = string | number;

// Only south and east expansion make sense in a grid system,
// similar to how spreadsheets work?
// North and west expansion would require shifting all content
// and negative column and row input values.
interface TGridExpansionConfig {
	south: boolean;
	east: boolean;
}
