import { createState, TState } from 'feature-state';

// TODO: Make feature object? e.g. to expand with custom move strategies, ..
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
	 * Removes empty rows from the bottom of the grid.
	 * A row is considered empty if all its cells are null.
	 * Will not remove rows that contain any non-null cells.
	 *
	 * @returns Number of rows removed
	 *
	 * @example
	 * // Before trimming:
	 * // [['A', 'B'],
	 * //  [null, null],
	 * //  [null, null]]
	 * grid.trimGrid()
	 * // After trimming:
	 * // [['A', 'B']]
	 * // Returns: 2
	 */
	public trimGrid(): number {
		let rowsRemoved = 0;

		// Start from bottom, remove rows until we find non-empty row
		while (this.cells.length > 1) {
			// Keep at least one row
			const lastRow = this.cells[this.cells.length - 1];
			if (lastRow?.some((cell) => cell !== null)) {
				break;
			}
			this.cells.pop();
			rowsRemoved++;
		}

		return rowsRemoved;
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
	 * Moves a region to a new position using the override strategy.
	 * This strategy simply places the region at the target position and leaves an empty space behind.
	 *
	 * Strategy Rules:
	 * 1. Region is placed directly at the target position
	 * 2. Any existing content at the target position is overwritten (if override=true)
	 * 3. Original position becomes empty
	 * 4. No cascading effects on other regions
	 * 5. Can create gaps in the grid
	 *
	 * @param currentRegion - Region to be moved
	 * @param targetPosition - Where to place the region
	 * @param options.override - Whether to override existing content (default: true)
	 * @returns true if move was successful, false if blocked and override=false
	 *
	 * @example
	 * // Before: [['A', 'A'], ['B', 'B']]
	 * grid.overrideMove(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } },
	 *   { row: 1, col: 0 }
	 * )
	 * // After: [[null, null], ['A', 'A']]
	 */
	public overrideMove(
		currentRegion: TGridRegion,
		targetPosition: TGridPosition,
		options: { override?: boolean } = {}
	): boolean {
		const { override = true } = options;
		const targetRegion: TGridRegion = {
			start: targetPosition,
			dimension: currentRegion.dimension
		};

		if (!override && this.getOccupyingRegions(targetRegion).length > 0) {
			return false;
		}

		const id = this.cells[currentRegion.start.row]?.[currentRegion.start.col] ?? null;
		this.clearRegion(currentRegion);
		this.fillRegion(targetRegion, id);
		return true;
	}

	/**
	 * Moves a region to a new position using a cascade strategy that maintains grid cohesion.
	 * This strategy attempts to maintain a compact grid by cascading regions into freed spaces
	 * and adjusting positions vertically when needed.
	 *
	 * Strategy Steps:
	 * 1. Clear the source region
	 * 2. Fill freed space with adjacent regions that fit
	 * 3. Push down regions that block the target position
	 * 4. Place the region at target position
	 * 5. Bubble up regions where possible to fill gaps
	 *
	 * Strategy Rules:
	 * 1. Never delete regions, only move them
	 * 2. Prefer moving adjacent regions into freed spaces
	 * 3. Push blocking regions down to make space
	 * 4. Allow regions to move up into freed spaces
	 * 5. Maintain vertical alignment where possible
	 * 6. Expand grid vertically if needed
	 *
	 * @param sourceRegion - Region to be moved
	 * @param targetPosition - Where to move the region
	 * @returns Array of regions that were affected by the move (empty if move failed)
	 *
	 * @example
	 * // Moving region 'A' to position [1,1] causes cascading moves
	 * // Before:     After:
	 * // [A B C]    [B F C]
	 * // [A B D] -> [B A D]
	 * // [E F G]    [E A G]
	 */
	public cascadeMove(
		sourceRegion: TGridRegion,
		targetPosition: TGridPosition
	): TGridRegionWithId<GGridCellId>[] {
		const affectedRegions: TGridRegionWithId<GGridCellId>[] = [];
		const id = this.cells[sourceRegion.start.row]?.[sourceRegion.start.col] ?? null;
		if (id == null) {
			return [];
		}

		const targetRegion: TGridRegion = {
			start: targetPosition,
			dimension: sourceRegion.dimension
		};

		// Expand grid if needed
		this.expandGrid({
			rows: targetRegion.start.row + targetRegion.dimension.height,
			strategy: 'Set'
		});

		// Track regions that need to be moved out of the target region
		const occupyingRegions = this.getOccupyingRegions(targetRegion).filter(
			(region) => region.id !== id
		);

		// 1. Clear source region and track freed region
		this.clearRegion(sourceRegion);
		const freedRegions: TGridRegion[] = [sourceRegion];

		// 2. Fill freed spaces with fitting regions
		while (true) {
			let movedSomething = false;

			for (const [freedIndex, freedRegion] of freedRegions.entries()) {
				const isTargetRegion = this.doRegionsOverlap(freedRegion, targetRegion);

				// Find best fitting region from occupying regions
				const bestFit = occupyingRegions
					.filter((region) => {
						// Must be adjacent within distance constraints
						const isAdjacent = this.areRegionsAdjacent(freedRegion, region, {
							maxDistance: isTargetRegion ? 0 : 9
						});
						// Must fit within the freed region
						const fitsSpace =
							region.dimension.width <= freedRegion.dimension.width &&
							region.dimension.height <= freedRegion.dimension.height;

						return isAdjacent && fitsSpace;
					})
					// Prefer larger regions to minimize fragmentation
					.sort((a, b) => this.getRegionArea(b) - this.getRegionArea(a))[0];

				if (bestFit == null) {
					continue;
				}

				// Move the region to freed region
				this.overrideMove(bestFit, freedRegion.start);

				// Update tracking of occupying regions
				if (
					!this.doRegionsOverlap(
						{ start: freedRegion.start, dimension: bestFit.dimension },
						targetRegion
					)
				) {
					const index = occupyingRegions.findIndex((r) => r.id === bestFit.id);
					if (index !== -1) {
						occupyingRegions.splice(index, 1);
					}
				}

				// Remove used region and add new freed regions
				freedRegions.splice(freedIndex, 1);
				freedRegions.push(
					// Regions remaining in current freed region
					...this.getComplementaryRegions(freedRegion, {
						start: freedRegion.start,
						dimension: bestFit.dimension
					}),
					// Regions freed up from moved region's original position
					...this.getComplementaryRegions(bestFit, targetRegion)
				);

				// Optimize freed regions by merging adjacent regions
				this.mergeAdjacentRegions(freedRegions, { mutate: true });

				// Track affected region
				affectedRegions.push({
					id: bestFit.id,
					start: freedRegion.start,
					dimension: bestFit.dimension
				});

				movedSomething = true;
				break;
			}

			// Exit if no moves were made or no freed regions left
			if (!movedSomething || freedRegions.length === 0) {
				break;
			}
		}

		// 3. Push down remaining blocking regions
		if (occupyingRegions.length > 0) {
			const boundingRegion = this.getBoundingRegion(occupyingRegions);
			if (boundingRegion != null) {
				const moveDownBy =
					targetRegion.start.row + targetRegion.dimension.height - boundingRegion.start.row;
				const regionsToMove = this.getOccupyingRegions({
					start: {
						row: boundingRegion.start.row,
						col: boundingRegion.start.col
					},
					dimension: {
						width: boundingRegion.dimension.width,
						height: this.size.rows - boundingRegion.start.row
					}
				});

				// Expand grid if needed
				const maxRowNeeded = Math.max(
					...regionsToMove.map((region) => region.start.row + region.dimension.height + moveDownBy)
				);
				if (maxRowNeeded > this.size.rows) {
					this.expandGrid({ rows: maxRowNeeded, strategy: 'Set' });
				}

				// Move regions down (bottom to top)
				regionsToMove
					.sort((a, b) => b.start.row - a.start.row)
					.forEach((region) => {
						const newPosition = {
							row: region.start.row + moveDownBy,
							col: region.start.col
						};
						this.overrideMove(region, newPosition);
						affectedRegions.push({
							id: region.id,
							start: newPosition,
							dimension: region.dimension
						});
					});
			}
		}

		// 4. Place region at target
		this.fillRegion(targetRegion, id);
		affectedRegions.push({ id, ...targetRegion });

		// 5. Bubble up regions where possible
		if (freedRegions.length > 0) {
			// Sort freed regions from top to bottom to maintain visual consistency
			freedRegions.sort((a, b) => a.start.row - b.start.row);

			for (const [freedIndex, freedRegion] of freedRegions.entries()) {
				// Find all regions below this freed space that could potentially move up
				const regionsBelow = this.getOccupyingRegions({
					start: {
						row: freedRegion.start.row + freedRegion.dimension.height,
						col: freedRegion.start.col
					},
					dimension: {
						width: freedRegion.dimension.width,
						height: this.size.rows - (freedRegion.start.row + freedRegion.dimension.height)
					}
				}).filter((region) => !this.doRegionsOverlap(region, targetRegion));

				// Check if the entire column can move up without breaking layout
				const canMoveUp =
					regionsBelow.length > 0 &&
					regionsBelow.every(
						(region) =>
							// Region must fit within the freed region width
							region.start.col >= freedRegion.start.col &&
							region.start.col + region.dimension.width <=
								freedRegion.start.col + freedRegion.dimension.width &&
							// Moving up shouldn't create overlap with target region
							!this.doRegionsOverlap(
								{
									start: {
										row: region.start.row - freedRegion.dimension.height,
										col: region.start.col
									},
									dimension: region.dimension
								},
								targetRegion
							)
					);

				if (canMoveUp) {
					const moveUpBy = freedRegion.dimension.height;
					// Move regions up from top to bottom to maintain relative positions
					regionsBelow
						.sort((a, b) => a.start.row - b.start.row)
						.forEach((region) => {
							const newPosition = {
								row: region.start.row - moveUpBy,
								col: region.start.col
							};
							this.overrideMove(region, newPosition);
							affectedRegions.push({
								id: region.id,
								start: newPosition,
								dimension: region.dimension
							});
						});

					// Remove the used freed region
					freedRegions.splice(freedIndex, 1);
				}
			}
		}

		// Remove empty rows from the bottom of the grid
		this.trimGrid();

		return affectedRegions;
	}

	private doRegionsOverlap(region1: TGridRegion, region2: TGridRegion): boolean {
		return !(
			region1.start.row + region1.dimension.height <= region2.start.row ||
			region1.start.row >= region2.start.row + region2.dimension.height ||
			region1.start.col + region1.dimension.width <= region2.start.col ||
			region1.start.col >= region2.start.col + region2.dimension.width
		);
	}

	/**
	 * Checks if two regions are adjacent within specified parameters
	 * @param region1 First region to check
	 * @param region2 Second region to check
	 * @param options Configuration options
	 * @param options.maxDistance Maximum number of cells that can be between regions (default: 0)
	 * @param options.includeDiagonal Whether to consider diagonal adjacency (default: true)
	 * @returns True if regions are adjacent according to the specified parameters
	 * @example
	 * // Check if regions are directly adjacent (no gap)
	 * grid.areRegionsAdjacent(region1, region2, { maxDistance: 0 })
	 *
	 * // Check if regions are at most 2 cells apart, excluding diagonals
	 * grid.areRegionsAdjacent(region1, region2, { maxDistance: 2, includeDiagonal: false })
	 *
	 * // Default behavior: 0 cell gap allowed, including diagonals
	 * grid.areRegionsAdjacent(region1, region2)
	 */
	public areRegionsAdjacent(
		region1: TGridRegion,
		region2: TGridRegion,
		options: { maxDistance?: number; includeDiagonal?: boolean } = {}
	): boolean {
		const { maxDistance = 0, includeDiagonal = true } = options;

		// Calculate the bounds of each region
		const r1Right = region1.start.col + region1.dimension.width - 1;
		const r1Bottom = region1.start.row + region1.dimension.height - 1;

		// Compute the horizontal and vertical gaps between the regions
		const horizontalGap = Math.max(0, Math.abs(region2.start.col - r1Right) - 1);
		const verticalGap = Math.max(0, Math.abs(region2.start.row - r1Bottom) - 1);

		// Check for diagonal adjacency (when horizontalGap equals verticalGap)
		const isDiagonal = horizontalGap === verticalGap && horizontalGap <= maxDistance;

		// Regions are adjacent if:
		// 1. They overlap (gap < 0)
		// 2. They touch (gap = 0)
		// 3. They are within maxDistance (gap <= maxDistance)

		// If diagonal adjacency is not allowed, exclude diagonal cases
		if (!includeDiagonal && isDiagonal) {
			return false;
		}

		// Adjacency is valid if both gaps are within maxDistance
		return horizontalGap <= maxDistance && verticalGap <= maxDistance;
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
	 * Returns all regions that occupy any part of the specified region
	 * @example
	 * // Grid: [['A', 'B', 'B'],
	 * //        ['A', 'C', 'B'],
	 * //        ['D', 'D', 'D']]
	 * const region = { start: { row: 0, col: 1 }, dimension: { width: 2, height: 2 } };
	 * grid.getOccupyingRegions(region)
	 * // Returns: [
	 * //   { id: 'B', start: { row: 0, col: 1 }, dimension: { width: 2, height: 2 } },
	 * //   { id: 'C', start: { row: 1, col: 1 }, dimension: { width: 1, height: 1 } }
	 * // ]
	 */
	public getOccupyingRegions(region: TGridRegion): TGridRegionWithId<GGridCellId>[] {
		const occupyingRegions: TGridRegionWithId<GGridCellId>[] = [];
		const processedIds = new Set<GGridCellId>();

		this.iterateRegion(region, (row, col) => {
			const cellId = this.cells[row]?.[col];
			if (cellId != null && !processedIds.has(cellId)) {
				processedIds.add(cellId);
				const occupyingRegion = this.findRegion(
					{ row, col },
					{
						isValidCell: (r, c) => this.cells[r]?.[c] === cellId
					}
				);
				occupyingRegions.push({
					id: cellId,
					...occupyingRegion
				});
			}
		});

		return occupyingRegions;
	}

	public isRegionEmpty(region: TGridRegion): boolean {
		let isEmpty = true;
		this.iterateRegion(region, (row, col) => {
			if (this.cells[row]?.[col] !== null) {
				isEmpty = false;
			}
		});
		return isEmpty;
	}

	/**
	 * Returns an array of rectangular regions that represent the empty space
	 * when placing one region inside another
	 * @example
	 * // When placing a 1x1 region at (1,1) inside a 2x2 region at (0,0)
	 * // Returns three regions: top row, left bottom, right bottom
	 * getComplementaryRegions(
	 *   { start: { row: 0, col: 0 }, dimension: { width: 2, height: 2 } },
	 *   { start: { row: 1, col: 1 }, dimension: { width: 1, height: 1 } }
	 * )
	 */
	public getComplementaryRegions(container: TGridRegion, placed: TGridRegion): TGridRegion[] {
		// Check if regions overlap at all
		if (
			placed.start.row >= container.start.row + container.dimension.height ||
			placed.start.row + placed.dimension.height <= container.start.row ||
			placed.start.col >= container.start.col + container.dimension.width ||
			placed.start.col + placed.dimension.width <= container.start.col
		) {
			// If no overlap, return the entire container as available space
			return [container];
		}

		const complementary: TGridRegion[] = [];

		// Top region (if exists)
		if (placed.start.row > container.start.row) {
			complementary.push({
				start: container.start,
				dimension: {
					width: container.dimension.width,
					height: placed.start.row - container.start.row
				}
			});
		}

		// Left region (if exists)
		if (placed.start.col > container.start.col) {
			complementary.push({
				start: {
					row: placed.start.row,
					col: container.start.col
				},
				dimension: {
					width: placed.start.col - container.start.col,
					height: placed.dimension.height
				}
			});
		}

		// Right region (if exists)
		const placedEndCol = placed.start.col + placed.dimension.width;
		const containerEndCol = container.start.col + container.dimension.width;
		if (placedEndCol < containerEndCol) {
			complementary.push({
				start: {
					row: placed.start.row,
					col: placedEndCol
				},
				dimension: {
					width: containerEndCol - placedEndCol,
					height: placed.dimension.height
				}
			});
		}

		// Bottom region (if exists)
		const placedEndRow = placed.start.row + placed.dimension.height;
		const containerEndRow = container.start.row + container.dimension.height;
		if (placedEndRow < containerEndRow) {
			complementary.push({
				start: {
					row: placedEndRow,
					col: container.start.col
				},
				dimension: {
					width: container.dimension.width,
					height: containerEndRow - placedEndRow
				}
			});
		}

		return complementary;
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
	public iterateRegion(region: TGridRegion, callback: (row: number, col: number) => void): void {
		for (let row = region.start.row; row < region.start.row + region.dimension.height; row++) {
			for (let col = region.start.col; col < region.start.col + region.dimension.width; col++) {
				callback(row, col);
			}
		}
	}

	/**
	 * Returns the area of a region
	 */
	public getRegionArea(region: TGridRegion): number {
		return region.dimension.width * region.dimension.height;
	}

	/**
	 * Merges adjacent regions into larger rectangles where possible
	 * @param regions Array of regions to merge
	 * @param options.mutate If true, modifies the input array directly instead of creating a new one
	 * @returns Array of merged regions (same array if mutate=true)
	 * @example
	 * // Merge two horizontally adjacent 1x1 regions into a 2x1 region
	 * const regions = [
	 *   { start: { row: 0, col: 0 }, dimension: { width: 1, height: 1 } },
	 *   { start: { row: 0, col: 1 }, dimension: { width: 1, height: 1 } }
	 * ];
	 * grid.mergeAdjacentRegions(regions)
	 * // Returns: [{ start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } }]
	 */
	public mergeAdjacentRegions(
		regions: TGridRegion[],
		options: { mutate?: boolean } = {}
	): TGridRegion[] {
		if (regions.length <= 1) {
			return regions;
		}
		const { mutate = false } = options;

		const merged = mutate ? regions : [...regions];
		let didMerge: boolean;

		do {
			didMerge = false;
			for (let i = 0; i < merged.length; i++) {
				for (let j = i + 1; j < merged.length; j++) {
					const region1 = merged[i];
					const region2 = merged[j];
					if (region1 == null || region2 == null) continue;

					// Try to merge horizontally
					if (
						region1.dimension.height === region2.dimension.height &&
						region1.start.row === region2.start.row &&
						(region1.start.col + region1.dimension.width === region2.start.col ||
							region2.start.col + region2.dimension.width === region1.start.col)
					) {
						merged[i] = {
							start: {
								row: region1.start.row,
								col: Math.min(region1.start.col, region2.start.col)
							},
							dimension: {
								height: region1.dimension.height,
								width: region1.dimension.width + region2.dimension.width
							}
						};
						merged.splice(j, 1);
						didMerge = true;
						break;
					}

					// Try to merge vertically
					if (
						region1.dimension.width === region2.dimension.width &&
						region1.start.col === region2.start.col &&
						(region1.start.row + region1.dimension.height === region2.start.row ||
							region2.start.row + region2.dimension.height === region1.start.row)
					) {
						merged[i] = {
							start: {
								row: Math.min(region1.start.row, region2.start.row),
								col: region1.start.col
							},
							dimension: {
								height: region1.dimension.height + region2.dimension.height,
								width: region1.dimension.width
							}
						};
						merged.splice(j, 1);
						didMerge = true;
						break;
					}
				}
				if (didMerge) {
					break;
				}
			}
		} while (didMerge);

		return merged;
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

interface TExpandGridMethodOptions {
	strategy?: 'Set' | 'Add';
	rows?: number;
	columns?: number;
}
