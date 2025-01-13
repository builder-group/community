export class Grid<GGridCellContent extends TGridCellContent = string> {
	private _cells: (GGridCellContent | null)[][];
	private _config: TGridConfig;

	/**
	 * Creates a new Grid with optional initial content and configuration
	 * @example
	 * const grid = new Grid([['A', 'B'], ['C', 'D']])
	 * const expandableGrid = new Grid([], { expansion: { south: true, east: true } })
	 */
	constructor(grid: (GGridCellContent | TEmptyGridCell)[][] = [[]], options: TGridOptions = {}) {
		this._config = {
			expansion: {
				south: false,
				east: false
			},
			...options
		};
		this._cells = grid;
	}

	/**
	 * Current dimensions of the grid
	 * @example
	 * const { rows, columns } = grid.dimensions // { rows: 2, columns: 3 }
	 */
	public get dimensions(): { rows: number; columns: number } {
		return {
			rows: this._cells.length,
			columns: this._cells[0]?.length ?? 0
		};
	}

	/**
	 * Read-only access to grid content
	 * @example
	 * const cells = grid.cells // [['A', 'B'], ['C', null]]
	 */
	public get cells(): ReadonlyArray<ReadonlyArray<GGridCellContent | TEmptyGridCell>> {
		return this._cells; // .map((row) => [...row]);
	}

	/**
	 * Returns all rectangular regions in the grid, optionally within a specified range
	 * @example
	 * const grid = new Grid([
	 *   ['A', 'A', 'B'],
	 *   ['A', 'A', 'B'],
	 *   ['C', 'C', 'B']
	 * ])
	 * grid.getRegions()
	 * // Returns:
	 * // [
	 * //   { content: 'A', start: { row: 0, col: 0 }, dimension: { width: 2, height: 2 } },
	 * //   { content: 'B', start: { row: 0, col: 2 }, dimension: { width: 1, height: 3 } },
	 * //   { content: 'C', start: { row: 2, col: 0 }, dimension: { width: 2, height: 1 } }
	 * // ]
	 */
	public getRegions(range?: TGridRange): TGridRegionWithContent<GGridCellContent>[] {
		const { rows, columns } = this.dimensions;
		if (rows === 0 || columns === 0) {
			return [];
		}

		// Use provided range or full grid
		const computeRange = range ?? {
			start: { row: 0, col: 0 },
			end: { row: rows, col: columns }
		};

		const visitedCells = new Set<string>();
		const regions: TGridRegionWithContent<GGridCellContent>[] = [];

		// Only compute regions within the specified range
		this.iterateRange(computeRange, (row, col) => {
			const cellKey = this.getCellKey(row, col);
			if (visitedCells.has(cellKey)) {
				return;
			}

			const content = this._cells[row]?.[col];
			if (content == null) {
				visitedCells.add(cellKey);
				return;
			}

			const region = this.findRegion(
				{ row, col },
				{
					directions: {
						right: true,
						down: true
					},
					isValidCell: (r, c) => {
						// Check bounds
						if (
							r < computeRange.start.row ||
							r >= computeRange.end.row ||
							c < computeRange.start.col ||
							c >= computeRange.end.col
						) {
							return false;
						}

						// Check content and not visited
						return this._cells[r]?.[c] === content && !visitedCells.has(this.getCellKey(r, c));
					}
				}
			);

			this.iterateRegion(region, (r, c) => {
				visitedCells.add(this.getCellKey(r, c));
			});

			regions.push({
				content,
				...region
			});
		});

		return regions;
	}

	/**
	 * Finds a rectangular region from a position by expanding in allowed directions until a condition is met
	 * @example
	 * // Find region in all directions (default)
	 * grid.findRegion(
	 *   { row: 1, col: 1 },
	 *   (row, col) => grid.cells[row]?.[col] === 'A'
	 * )
	 *
	 * // Find region only expanding down and right
	 * grid.findRegion(
	 *   { row: 0, col: 0 },
	 *   (row, col) => grid.cells[row]?.[col] === 'A',
	 *   { directions: { down: true, right: true } }
	 * )
	 */
	public findRegion(position: TGridPosition, options: TFindRegionOptions = {}): TGridRegion {
		const {
			isValidCell = (r, c) => this._cells[r]?.[c] === this._cells[position.row]?.[position.col],
			directions = {}
		} = options;
		const {
			up: upDirection = true,
			down: downDirection = true,
			left: leftDirection = true,
			right: rightDirection = true
		} = directions;
		let left = 0;
		let right = 0;
		let up = 0;
		let down = 0;

		// Expand left until invalid or grid boundary
		if (leftDirection) {
			while (
				position.col - (left + 1) >= 0 &&
				isValidCell(position.row, position.col - (left + 1))
			) {
				left++;
			}
		}

		// Expand right until invalid or grid boundary
		if (rightDirection) {
			while (
				position.col + right + 1 < this.dimensions.columns &&
				isValidCell(position.row, position.col + right + 1)
			) {
				right++;
			}
		}

		// Expand up until invalid or grid boundary
		if (upDirection) {
			while (position.row - (up + 1) >= 0) {
				let isRowValid = true;
				for (let col = position.col - left; col <= position.col + right; col++) {
					if (!isValidCell(position.row - (up + 1), col)) {
						isRowValid = false;
						break;
					}
				}
				if (!isRowValid) break;
				up++;
			}
		}

		// Expand down until invalid or grid boundary
		if (downDirection) {
			while (position.row + down + 1 < this.dimensions.rows) {
				let isRowValid = true;
				for (let col = position.col - left; col <= position.col + right; col++) {
					if (!isValidCell(position.row + down + 1, col)) {
						isRowValid = false;
						break;
					}
				}
				if (!isRowValid) break;
				down++;
			}
		}

		return {
			start: {
				row: position.row - up,
				col: position.col - left
			},
			dimension: {
				width: left + right + 1,
				height: up + down + 1
			}
		};
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
			if (this._cells[row] != null) {
				this._cells[row][col] = null;
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
			if (this._cells[row] != null) {
				this._cells[row][col] = content;
			}
		});
	}

	/**
	 * Generates a unique key for a cell position
	 */
	public getCellKey(row: number, col: number): string {
		return `${row}-${col}`;
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
	 * Iterates over cells within a specified range
	 */
	private iterateRange(range: TGridRange, callback: (row: number, col: number) => void): void {
		for (let row = range.start.row; row < range.end.row; row++) {
			for (let col = range.start.col; col < range.end.col; col++) {
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
		return this._cells
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
	start: TGridPosition;
	dimension: TGridDimensions;
}

interface TGridRegionWithContent<GGridCellContent extends TGridCellContent> extends TGridRegion {
	content: GGridCellContent;
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

export interface TGridRange {
	start: TGridPosition;
	end: TGridPosition;
}

export interface TGridPosition {
	row: number;
	col: number;
}

export interface TGridDimensions {
	width: number;
	height: number;
}

interface TFindRegionOptions {
	isValidCell?: (row: number, col: number) => boolean;
	directions?: {
		up?: boolean;
		down?: boolean;
		left?: boolean;
		right?: boolean;
	};
}
