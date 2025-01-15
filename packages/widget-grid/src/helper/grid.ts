import { createState, TState } from 'feature-state';

export class Grid<GGridCellId extends TGridCellId = string> {
	private _cells: TState<(GGridCellId | null)[][], []>; // TODO: Make this a state? We need to listen on changes and a state is basically a value with listeners..
	private _config: TGridConfig;

	/**
	 * Creates a new Grid with optional initial cell ids and configuration
	 * @example
	 * const grid = new Grid([['A', 'B'], ['C', 'D']])
	 * const expandableGrid = new Grid([], { expansion: { south: true, east: true } })
	 */
	constructor(cells: (GGridCellId | TEmptyGridCell)[][] = [[]], options: TGridOptions = {}) {
		this._config = {
			expansion: {
				south: false,
				east: false
			},
			...options
		};
		this._cells = createState(cells);
	}

	/**
	 * Current dimensions of the grid
	 * @example
	 * const { rows, columns } = grid.size // { rows: 2, columns: 3 }
	 */
	public get size(): TGridSize {
		return {
			rows: this.cells.length,
			columns: this.cells[0]?.length ?? 0
		};
	}

	/**
	 * Direct access to grid cells state
	 */
	// TODO: Make private and readonly?
	public get cellsState(): TState<(GGridCellId | null)[][], []> {
		return this._cells;
	}

	/**
	 * Direct access to grid cells
	 */
	// TODO: Make private and readonly?
	public get cells(): (GGridCellId | null)[][] {
		return this._cells._v;
	}

	/**
	 * Generates a unique key for a cell position
	 */
	public getCellKey(row: number, col: number): string {
		return `${row}-${col}`;
	}

	/**
	 * Returns the cell at the specified position
	 */
	public getCellAt(row: number, col: number): GGridCellId | TEmptyGridCell {
		return this.cells[row]?.[col] ?? null;
	}

	/**
	 * Expands the grid using the specified strategy and dimensions
	 * @example
	 * // Set exact grid size (won't shrink)
	 * grid.expandGrid({ strategy: 'set', rows: 5, columns: 4 })
	 *
	 * // Expand grid by adding dimensions
	 * grid.expandGrid({ strategy: 'add', rows: 2, columns: 1 })
	 */
	public expandGrid(options: TExpandGridMethodOptions = {}): void {
		const { strategy = 'Set', rows = 0, columns = 0 } = options;

		let targetRows: number;
		let targetColumns: number;

		switch (strategy) {
			case 'Add':
				targetRows = this.size.rows + rows;
				targetColumns = this.size.columns + columns;
				break;
			case 'Set':
			default:
				targetRows = Math.max(this.size.rows, rows);
				targetColumns = Math.max(this.size.columns, columns);
		}

		// Add rows
		while (this.cells.length < targetRows) {
			this.cells.push(new Array(this.size.columns).fill(null));
		}

		// Add columns
		for (const row of this.cells) {
			while (row.length < targetColumns) {
				row.push(null);
			}
		}
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
	 * // Returns regions with their IDs:
	 * // [
	 *   { id: 'A', start: { row: 0, col: 0 }, dimension: { width: 2, height: 2 } },
	 *   { id: 'B', start: { row: 0, col: 2 }, dimension: { width: 1, height: 3 } },
	 *   { id: 'C', start: { row: 2, col: 0 }, dimension: { width: 2, height: 1 } }
	 * // ]
	 */
	public getRegions(range?: TGridRange): TGridRegionWithId<GGridCellId>[] {
		const { rows, columns } = this.size;
		if (rows === 0 || columns === 0) {
			return [];
		}

		// Use provided range or full grid
		const computeRange = range ?? {
			start: { row: 0, col: 0 },
			end: { row: rows, col: columns }
		};

		const visitedCells = new Set<string>();
		const regions: TGridRegionWithId<GGridCellId>[] = [];

		// Only compute regions within the specified range
		this.iterateRange(computeRange, (row, col) => {
			const cellKey = this.getCellKey(row, col);
			if (visitedCells.has(cellKey)) {
				return;
			}

			const id = this.cells[row]?.[col];
			if (id == null) {
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

						// Check id and not visited
						return this.cells[r]?.[c] === id && !visitedCells.has(this.getCellKey(r, c));
					}
				}
			);

			this.iterateRegion(region, (r, c) => {
				visitedCells.add(this.getCellKey(r, c));
			});

			regions.push({
				id,
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
	public findRegion(position: TGridPosition, options: TFindRegionMethodOptions = {}): TGridRegion {
		const {
			isValidCell = (r, c) => this.cells[r]?.[c] === this.cells[position.row]?.[position.col],
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
				position.col + right + 1 < this.size.columns &&
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
			while (position.row + down + 1 < this.size.rows) {
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
	 * Moves id from one region to another using the specified strategy
	 * @example
	 * // Override strategy (default)
	 * grid.moveRegion(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   { start: { row: 1, col: 0 }, dimension: { width: 2, height: 1 } }
	 * )
	 *
	 * // Rearrange strategy with expansion
	 * grid.moveRegion(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   { start: { row: 1, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   { strategy: 'Rearrange', expansion: { south: true, east: true } }
	 * )
	 */
	// TODO: We targetRegion should be position?
	public moveRegion(
		currentRegion: TGridRegion,
		targetRegion: TGridRegion,
		options: TMoveRegionMethodOptions = {}
	): boolean {
		const { strategy = 'Override', expansion = {} } = options;

		switch (strategy) {
			case 'Override':
				return this.moveRegionByOverride(currentRegion, targetRegion);
			case 'Rearrange':
				return this.moveRegionByRearrange(currentRegion, targetRegion, expansion);
			case 'SwapCascade':
				return this.moveRegionBySwapCascade(currentRegion, targetRegion);
			default:
				return false;
		}
	}

	/**
	 * Moves region by overriding target region's cells
	 */
	private moveRegionByOverride(currentRegion: TGridRegion, targetRegion: TGridRegion): boolean {
		const id = this.cells[currentRegion.start.row]?.[currentRegion.start.col] ?? null;
		this.clearRegion(currentRegion);
		this.fillRegion(targetRegion, id);
		return true;
	}

	private moveRegionBySwapCascade(currentRegion: TGridRegion, targetRegion: TGridRegion): boolean {
		const id = this.cells[currentRegion.start.row]?.[currentRegion.start.col] ?? null;
		const updatedRegions: TGridRegion[] = [];

		// Find all regions that occupy the target region
		const occupyingRegions: TGridRegionWithId<GGridCellId>[] = [];
		this.iterateRegion(targetRegion, (row, col) => {
			const cell = this.cells[row]?.[col];
			if (cell != null && id !== cell && !occupyingRegions.some((r) => r.id === cell)) {
				const occupyingRegion = this.findRegion(
					{ row, col },
					{
						isValidCell: (r, c) => this.cells[r]?.[c] === cell
					}
				);
				occupyingRegions.push({
					id: cell,
					...occupyingRegion
				});
			}
		});

		// Swap regions if they have the same dimensions
		const boundingOccupyingRegion = this.getBoundingRegion(occupyingRegions);
		if (
			boundingOccupyingRegion?.dimension.width === currentRegion.dimension.width &&
			boundingOccupyingRegion?.dimension.height === currentRegion.dimension.height
		) {
			const offset = this.getOffset(targetRegion.start, currentRegion.start);
			for (const occupyingRegion of occupyingRegions) {
				this.fillRegion(
					{
						start: {
							row: occupyingRegion.start.row + offset.row,
							col: occupyingRegion.start.col + offset.col
						},
						dimension: occupyingRegion.dimension
					},
					occupyingRegion.id
				);
			}
			this.fillRegion(targetRegion, id);
			return true;
		}

		// TODO: What if not same dimensions

		return false;
	}

	/**
	 * Moves region by rearranging regions, swapping with any existing region
	 */
	private moveRegionByRearrange(
		currentRegion: TGridRegion,
		targetRegion: TGridRegion,
		expansion: { south?: boolean; east?: boolean } = {}
	): boolean {
		const { south = false, east = false } = expansion;
		const id = this.cells[currentRegion.start.row]?.[currentRegion.start.col] ?? null;

		// Check bounds
		const maxRow = expansion.south ? Infinity : this.size.rows;
		const maxCol = expansion.east ? Infinity : this.size.columns;
		if (
			!(
				targetRegion.start.row >= 0 &&
				targetRegion.start.col >= 0 &&
				targetRegion.start.row + targetRegion.dimension.height <= maxRow &&
				targetRegion.start.col + targetRegion.dimension.width <= maxCol
			)
		) {
			return false;
		}

		// Expand grid if needed
		if (south || east) {
			const requiredRows = targetRegion.start.row + targetRegion.dimension.height;
			const requiredColumns = targetRegion.start.col + targetRegion.dimension.width;

			this.expandGrid({
				rows: south ? requiredRows : undefined,
				columns: east ? requiredColumns : undefined,
				strategy: 'Set'
			});
		}

		// Find first non-null id in target region
		let occupyingId: GGridCellId | null = null;
		this.iterateRegion(targetRegion, (row, col) => {
			const cell = this.cells[row]?.[col];
			if (cell != null && id !== cell && occupyingId == null) {
				occupyingId = cell;
			}
		});

		if (occupyingId == null) {
			this.clearRegion(currentRegion);
			this.fillRegion(targetRegion, id);
			return true;
		}

		const occupyingRegion = this.findRegion(
			{ row: targetRegion.start.row, col: targetRegion.start.col },
			{
				isValidCell: (r, c) => this.cells[r]?.[c] === occupyingId
			}
		);

		// Swap regions
		this.clearRegion(currentRegion);
		this.clearRegion(occupyingRegion);
		this.fillRegion(
			{ start: currentRegion.start, dimension: occupyingRegion.dimension },
			occupyingId
		);
		this.fillRegion(targetRegion, id);

		return true;
	}

	/**
	 * Swaps regions while maintaining their original shapes
	 * @example
	 * // Before: [['A', 'A', 'B'], ['A', 'A', 'B']]
	 * grid.swapRegions(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 2 } }, // Region with ID 'A'
	 *   { start: { row: 0, col: 2 }, dimension: { width: 1, height: 2 } }, // Region with ID 'B'
	 *   'A', 'B'
	 * )
	 * // After: [['B', 'B', 'A'], ['B', 'B', 'A']]
	 */
	public swapRegions(
		region1: TGridRegion,
		region2: TGridRegion,
		id1: GGridCellId,
		id2: GGridCellId
	): void {
		this.clearRegion(region1);
		this.clearRegion(region2);
		this.fillRegion(region1, id2);
		this.fillRegion(region2, id1);
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
			if (this.cells[row] != null) {
				this.cells[row][col] = null;
			}
		});
	}

	/**
	 * Fills the specified region with the given ID
	 * @example
	 * // Before: [[null, null], ['B', 'B']]
	 * grid.fillRegion(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   'A'
	 * )
	 * // After: [['A', 'A'], ['B', 'B']]
	 */
	public fillRegion(region: TGridRegion, id: GGridCellId | null): void {
		this.iterateRegion(region, (row, col) => {
			if (this.cells[row] != null) {
				this.cells[row][col] = id;
			}
		});
	}

	/**
	 * Returns the smallest region that contains all input regions
	 * @example
	 * const regions = [
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   { start: { row: 1, col: 1 }, dimension: { width: 2, height: 2 } }
	 * ];
	 * grid.getBoundingRegion(regions)
	 * // Returns: {
	 * //   start: { row: 0, col: 0 },
	 * //   dimension: { width: 3, height: 3 }
	 * // }
	 */
	public getBoundingRegion(regions: TGridRegion[]): TGridRegion | null {
		if (regions.length === 0) {
			return null;
		}

		let minRow = Infinity;
		let minCol = Infinity;
		let maxRow = -Infinity;
		let maxCol = -Infinity;

		for (const region of regions) {
			minRow = Math.min(minRow, region.start.row);
			minCol = Math.min(minCol, region.start.col);
			maxRow = Math.max(maxRow, region.start.row + region.dimension.height);
			maxCol = Math.max(maxCol, region.start.col + region.dimension.width);
		}

		return {
			start: {
				row: minRow,
				col: minCol
			},
			dimension: {
				width: maxCol - minCol,
				height: maxRow - minRow
			}
		};
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
	 * Calculates the offset vector from one position to another
	 * @example
	 * const pos1 = { row: 1, col: 1 };
	 * const pos2 = { row: 3, col: 0 };
	 * grid.getOffset(pos1, pos2) // Returns { row: 2, col: -1 } (2 steps down, 1 step left)
	 */
	public getOffset(from: TGridPosition, to: TGridPosition): TGridPosition {
		return {
			row: to.row - from.row,
			col: to.col - from.col
		};
	}

	/**
	 * String representation of the grid, using '-' for empty cells
	 * @example
	 * // grid.cells = [['A', null], [null, 'B']]
	 * grid.toString() // 'A -\n- B'
	 */
	public toString(): string {
		return this.cells
			.map((row) => row.map((cell) => (cell == null ? '-' : cell)).join(' '))
			.join('\n');
	}
}

interface TGridConfig {
	maxRows?: number;
	maxColumns?: number;
	expansion: TGridExpansionConfig;
}

// Only south and east expansion make sense in a grid system,
// similar to how spreadsheets work?
// North and west expansion would require shifting all cells
// and negative column and row input values.
interface TGridExpansionConfig {
	south: boolean;
	east: boolean;
}

type TGridOptions = Partial<TGridConfig>;

export interface TGridRegion {
	start: TGridPosition;
	dimension: TGridDimensions;
}

export interface TGridRegionWithId<GGridCellId extends TGridCellId> extends TGridRegion {
	id: GGridCellId;
}

export type TEmptyGridCell = null;
export type TGridCellId = string | number;

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

export interface TGridSize {
	rows: number;
	columns: number;
}

interface TFindRegionMethodOptions {
	isValidCell?: (row: number, col: number) => boolean;
	directions?: {
		up?: boolean;
		down?: boolean;
		left?: boolean;
		right?: boolean;
	};
}

interface TMoveRegionMethodOptions {
	strategy?: 'Override' | 'Rearrange' | 'SwapCascade';
	expansion?: {
		south?: boolean;
		east?: boolean;
	};
}

interface TExpandGridMethodOptions {
	strategy?: 'Set' | 'Add';
	rows?: number;
	columns?: number;
}
