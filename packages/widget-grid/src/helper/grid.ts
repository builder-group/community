import { createState, TState } from 'feature-state';

// TODO: Make feature object? e.g. to expand with custom move strategies, ..
export class Grid<GGridCellId extends TGridCellId = string> {
	private _cells: TState<(GGridCellId | null)[][], []>; // TODO: Make this a state? We need to listen on changes and a state is basically a value with listeners..
	private _config: TGridConfig; // TODO: Integrate

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
	 */
	public get size(): TGridDimensions {
		return {
			rows: this.cells.length,
			cols: this.cells[0]?.length ?? 0
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
	 */
	public expandGrid(options: TExpandGridMethodOptions = {}): void {
		const { strategy = 'Set', rows = 0, cols = 0 } = options;

		let targetRows: number;
		let targetColumns: number;

		switch (strategy) {
			case 'Add':
				targetRows = this.size.rows + rows;
				targetColumns = this.size.cols + cols;
				break;
			case 'Set':
			default:
				targetRows = Math.max(this.size.rows, rows);
				targetColumns = Math.max(this.size.cols, cols);
		}

		// Add rows
		while (this.cells.length < targetRows) {
			this.cells.push(new Array(this.size.cols).fill(null));
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
	 */
	public getRegions(range?: TGridRange): TGridRegionWithId<GGridCellId>[] {
		const { rows, cols } = this.size;
		if (rows === 0 || cols === 0) {
			return [];
		}

		// Use provided range or full grid
		const computeRange = range ?? {
			start: { row: 0, col: 0 },
			end: { row: rows, col: cols }
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
	 * Returns the smallest region that contains all input regions
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
			maxRow = Math.max(maxRow, region.start.row + region.dimension.rows);
			maxCol = Math.max(maxCol, region.start.col + region.dimension.cols);
		}

		return {
			start: {
				row: minRow,
				col: minCol
			},
			dimension: {
				cols: maxCol - minCol,
				rows: maxRow - minRow
			}
		};
	}

	/**
	 * Returns all regions that occupy any part of the specified region
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

	/**
	 * Returns an array of regions that represent the remaining regions from the container region
	 * when the cutout region is "cut out" from it.
	 * @example
	 * [
	 *   [Y, Y, Y], // Container (Y)
	 *   [Y, X, Y], // Cutout (X)
	 *   [Y, Y, Y]
	 * ]
	 * [
	 *   [A, A, A], // Top region (A)
	 *   [B, X, C], // Left (B), Cutout (X), Right (C)
	 *   [D, D, D]  // Bottom region (D)
	 * ]
	 */
	public getComplementaryRegions(
		containerRegion: TGridRegion,
		cutoutRegion: TGridRegion
	): TGridRegion[] {
		// Check if regions overlap at all
		if (
			cutoutRegion.start.row >= containerRegion.start.row + containerRegion.dimension.rows ||
			cutoutRegion.start.row + cutoutRegion.dimension.rows <= containerRegion.start.row ||
			cutoutRegion.start.col >= containerRegion.start.col + containerRegion.dimension.cols ||
			cutoutRegion.start.col + cutoutRegion.dimension.cols <= containerRegion.start.col
		) {
			// If no overlap, return the entire container as available space
			return [containerRegion];
		}

		const complementary: TGridRegion[] = [];

		// Top region (if exists)
		if (cutoutRegion.start.row > containerRegion.start.row) {
			complementary.push({
				start: containerRegion.start,
				dimension: {
					cols: containerRegion.dimension.cols,
					rows: cutoutRegion.start.row - containerRegion.start.row
				}
			});
		}

		// Left region (if exists)
		if (cutoutRegion.start.col > containerRegion.start.col) {
			complementary.push({
				start: {
					row: cutoutRegion.start.row,
					col: containerRegion.start.col
				},
				dimension: {
					cols: cutoutRegion.start.col - containerRegion.start.col,
					rows: cutoutRegion.dimension.rows
				}
			});
		}

		// Right region (if exists)
		const placedEndCol = cutoutRegion.start.col + cutoutRegion.dimension.cols;
		const containerEndCol = containerRegion.start.col + containerRegion.dimension.cols;
		if (placedEndCol < containerEndCol) {
			complementary.push({
				start: {
					row: cutoutRegion.start.row,
					col: placedEndCol
				},
				dimension: {
					cols: containerEndCol - placedEndCol,
					rows: cutoutRegion.dimension.rows
				}
			});
		}

		// Bottom region (if exists)
		const placedEndRow = cutoutRegion.start.row + cutoutRegion.dimension.rows;
		const containerEndRow = containerRegion.start.row + containerRegion.dimension.rows;
		if (placedEndRow < containerEndRow) {
			complementary.push({
				start: {
					row: placedEndRow,
					col: containerRegion.start.col
				},
				dimension: {
					cols: containerRegion.dimension.cols,
					rows: containerEndRow - placedEndRow
				}
			});
		}

		return complementary;
	}

	/**
	 * Returns all empty (null) regions within the given region, merged into the largest possible rectangles
	 */
	public getFreeRegions(region: TGridRegion, options: { merge?: boolean } = {}): TGridRegion[] {
		const { merge = true } = options;

		// First collect all empty positions
		const freeRegions: TGridRegion[] = [];
		this.iterateRegion(region, (row, col) => {
			if (this.cells[row]?.[col] === null) {
				freeRegions.push({ start: { row, col }, dimension: { rows: 1, cols: 1 } });
			}
		});
		if (freeRegions.length === 0) {
			return [];
		}

		// Merge adjacent regions into largest possible rectangles
		return merge ? this.mergeAdjacentRegions(freeRegions) : freeRegions;
	}

	/**
	 * Returns the area of a region
	 */
	public getRegionArea(region: TGridRegion): number {
		return region.dimension.cols * region.dimension.rows;
	}

	/**
	 * Finds a rectangular region from a position by expanding in allowed directions until a condition is met
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
				position.col + right + 1 < this.size.cols &&
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
				cols: left + right + 1,
				rows: up + down + 1
			}
		};
	}

	/**
	 * Swaps regions while maintaining their original shapes
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
	 */
	public fillRegion(region: TGridRegion, id: GGridCellId | null): void {
		this.iterateRegion(region, (row, col) => {
			if (this.cells[row] != null) {
				this.cells[row][col] = id;
			}
		});
	}

	/**
	 * Iterates over each cell in the specified region
	 */
	public iterateRegion(region: TGridRegion, callback: (row: number, col: number) => void): void {
		for (let row = region.start.row; row < region.start.row + region.dimension.rows; row++) {
			for (let col = region.start.col; col < region.start.col + region.dimension.cols; col++) {
				callback(row, col);
			}
		}
	}

	public doRegionsOverlap(region1: TGridRegion, region2: TGridRegion): boolean {
		return !(
			region1.start.row + region1.dimension.rows <= region2.start.row ||
			region1.start.row >= region2.start.row + region2.dimension.rows ||
			region1.start.col + region1.dimension.cols <= region2.start.col ||
			region1.start.col >= region2.start.col + region2.dimension.cols
		);
	}

	/**
	 * Checks if two regions are adjacent within specified parameters
	 */
	public areRegionsAdjacent(
		region1: TGridRegion,
		region2: TGridRegion,
		options: { maxGap?: number; includeDiagonal?: boolean } = {}
	): boolean {
		const { maxGap = 0, includeDiagonal = true } = options;
		const maxDistance = maxGap + 1;

		// Calculate horizontal overlap and distance
		const r1Left = region1.start.col;
		const r1Right = region1.start.col + region1.dimension.cols - 1;
		const r2Left = region2.start.col;
		const r2Right = region2.start.col + region2.dimension.cols - 1;

		const sharesHorizontalSpace = !(r1Right < r2Left || r2Right < r1Left);
		const horizontalDistance = sharesHorizontalSpace
			? 0
			: Math.min(Math.abs(r1Left - r2Right), Math.abs(r2Left - r1Right));

		// Calculate vertical overlap and distance
		const r1Top = region1.start.row;
		const r1Bottom = region1.start.row + region1.dimension.rows - 1;
		const r2Top = region2.start.row;
		const r2Bottom = region2.start.row + region2.dimension.rows - 1;

		const sharesVerticalSpace = !(r1Bottom < r2Top || r2Bottom < r1Top);
		const verticalDistance = sharesVerticalSpace
			? 0
			: Math.min(Math.abs(r1Top - r2Bottom), Math.abs(r2Top - r1Bottom));

		// Regions are adjacent if:
		// 1. They are within maxDistance in both directions
		// 2. If includeDiagonal is false, the distances must be different
		return (
			horizontalDistance <= maxDistance &&
			verticalDistance <= maxDistance &&
			(includeDiagonal || horizontalDistance !== verticalDistance)
		);
	}

	/**
	 * Checks if a region is empty
	 */
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
	 * Checks if a region has an empty cell
	 */
	public hasRegionEmptyCell(region: TGridRegion): boolean {
		let hasEmpty = false;
		this.iterateRegion(region, (row, col) => {
			if (this.cells[row]?.[col] === null) {
				hasEmpty = true;
			}
		});
		return hasEmpty;
	}

	/**
	 * Checks if a region is out of bounds in specified directions
	 */
	public isRegionOutOfBounds(
		region: TGridRegion,
		options: { north?: boolean; east?: boolean; south?: boolean; west?: boolean } = {}
	): boolean {
		const { north = true, east = true, south = true, west = true } = options;

		return (
			(north && region.start.row < 0) ||
			(east && region.start.col + region.dimension.cols > this.size.cols) ||
			(south && region.start.row + region.dimension.rows > this.size.rows) ||
			(west && region.start.col < 0)
		);
	}

	/**
	 * Checks if a region fits within another region
	 */
	public doesRegionFit(region: TGridRegion, targetRegion: TGridRegion): boolean {
		return (
			region.dimension.cols <= targetRegion.dimension.cols &&
			region.dimension.rows <= targetRegion.dimension.rows
		);
	}

	/**
	 * Checks if a region can be moved to a target position
	 */
	public canMoveRegionTo(
		region: TGridRegionWithId<GGridCellId>,
		targetPosition: TGridPosition
	): boolean {
		const targetRegion = {
			start: targetPosition,
			dimension: region.dimension
		};

		// Check if target region would fit within grid dimensions
		if (this.isRegionOutOfBounds(targetRegion)) {
			return false;
		}

		// Get regions that would be affected by this move
		const occupyingRegions = this.getOccupyingRegions(targetRegion).filter(
			(r) => r.id !== region.id
		);

		return occupyingRegions.length === 0;
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

	// TODO: Open Issues
	// - Only allow downward movement as long as it's adjacent with widget above
	// - Edge cases where regions get out of bounds
	// - Doesn't feel natural sometimes

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
	 */
	public cascadeMove(
		sourceRegion: TGridRegion,
		targetPosition: TGridPosition
	): TGridRegionWithId<GGridCellId>[] {
		let affectedRegions: TGridRegionWithId<GGridCellId>[] = [];
		const id = this.cells[sourceRegion.start.row]?.[sourceRegion.start.col] ?? null;
		if (id == null) {
			return [];
		}

		const targetRegion: TGridRegion = {
			start: targetPosition,
			dimension: sourceRegion.dimension
		};

		// Don't allow placing regions outside the grid in north, east and west direction
		if (
			this.isRegionOutOfBounds(targetRegion, { north: true, east: true, south: false, west: true })
		) {
			return [];
		}

		// Expand grid in south direction if needed
		this.expandGrid({
			rows: targetRegion.start.row + targetRegion.dimension.rows,
			strategy: 'Set'
		});

		// Track regions that need to be moved out of the target region
		const occupyingRegions = this.getOccupyingRegions(targetRegion).filter(
			(region) => region.id !== id
		);

		// 1. Clear source region and track freed region
		this.clearRegion(sourceRegion);
		let freedRegions: TGridRegion[] = [...this.getComplementaryRegions(sourceRegion, targetRegion)];

		// 2. Fill freed spaces with fitting regions
		const moveHistory: Array<{
			region: TGridRegionWithId<GGridCellId>;
			originalPosition: TGridPosition;
			newPosition: TGridPosition;
		}> = [];
		while (true) {
			let movedSomething = false;

			for (const [freedIndex, freedRegion] of freedRegions.entries()) {
				const isTargetRegion = this.doRegionsOverlap(freedRegion, targetRegion);

				// Find best fitting region and position from occupying regions
				const moves = occupyingRegions
					.reduce<
						Array<{
							region: TGridRegionWithId<GGridCellId>;
							position: TGridPosition;
							avoidsTarget: boolean;
						}>
					>((moves, region) => {
						// Must be adjacent within distance constraints
						const isAdjacent = this.areRegionsAdjacent(freedRegion, region, {
							maxGap: isTargetRegion ? 0 : Infinity,
							includeDiagonal: false
						});
						if (!isAdjacent) {
							return moves;
						}

						// Check all possible positions within freed region
						this.iterateRegion(freedRegion, (row, col) => {
							const position: TGridPosition = { row, col };

							// Check if the region can be moved to this position
							if (!this.canMoveRegionTo(region, position)) {
								return;
							}

							const newRegion: TGridRegion = {
								start: position,
								dimension: region.dimension
							};

							// Check if this move actually contributes to freeing up the target region
							const freedRegions = this.getComplementaryRegions(region, newRegion);
							const freesTarget = freedRegions.some((r) => this.doRegionsOverlap(r, targetRegion));
							if (!freesTarget) {
								return;
							}

							moves.push({
								region,
								position,
								avoidsTarget: !this.doRegionsOverlap(newRegion, targetRegion)
							});
						});

						return moves;
					}, [])
					// Sort moves by target avoidance first, then region size
					.sort((a, b) => {
						if (a.avoidsTarget !== b.avoidsTarget) {
							return a.avoidsTarget ? -1 : 1;
						}
						return this.getRegionArea(b.region) - this.getRegionArea(a.region);
					});
				const bestMove = moves[0];

				if (bestMove == null) {
					continue;
				}

				// Track move for potential undo
				moveHistory.push({
					region: bestMove.region,
					originalPosition: bestMove.region.start,
					newPosition: bestMove.position
				});

				// Move the region to best position
				this.overrideMove(bestMove.region, bestMove.position);

				// Update tracking of occupying regions
				if (bestMove.avoidsTarget) {
					const index = occupyingRegions.findIndex((r) => r.id === bestMove.region.id);
					if (index !== -1) {
						occupyingRegions.splice(index, 1);
					}
				}

				// Remove used region and add new freed regions
				freedRegions.splice(freedIndex, 1);
				freedRegions.push(
					// Remaining free regions in current freed region
					...this.getFreeRegions(freedRegion, { merge: false }),
					// Regions freed up from moved region's original position
					...this.getFreeRegions(bestMove.region, { merge: false }).filter(
						(region) => !this.doRegionsOverlap(region, targetRegion)
					)
				);

				// Optimize freed regions by merging adjacent regions
				this.mergeAdjacentRegions(freedRegions, { mutate: true });

				// Track affected region
				affectedRegions.push({
					id: bestMove.region.id,
					start: bestMove.position,
					dimension: bestMove.region.dimension
				});

				movedSomething = true;
				break;
			}

			// Exit if no moves were made or no freed regions left
			if (!movedSomething || freedRegions.length === 0) {
				break;
			}
		}

		// If parts of source region that don't overlap with target region aren't filled, undo all moves
		const nonOverlappingRegions = this.getComplementaryRegions(sourceRegion, targetRegion);
		const hasUnfilledRegions = nonOverlappingRegions.some((region) =>
			this.hasRegionEmptyCell(region)
		);
		if (hasUnfilledRegions) {
			for (const move of moveHistory.reverse()) {
				this.overrideMove({ ...move.region, start: move.newPosition }, move.originalPosition);
			}
			freedRegions = [...nonOverlappingRegions];
			affectedRegions = [];
		}

		// 3. Push down remaining blocking regions
		if (occupyingRegions.length > 0) {
			const boundingRegion = this.getBoundingRegion(occupyingRegions);
			if (boundingRegion != null) {
				const moveDownBy =
					targetRegion.start.row + targetRegion.dimension.rows - boundingRegion.start.row;
				const regionsToMove = this.getOccupyingRegions({
					start: {
						row: boundingRegion.start.row,
						col: boundingRegion.start.col
					},
					dimension: {
						cols: boundingRegion.dimension.cols,
						rows: this.size.rows - boundingRegion.start.row
					}
				});

				// Expand grid if needed
				const maxRowNeeded = Math.max(
					...regionsToMove.map((region) => region.start.row + region.dimension.rows + moveDownBy)
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
						row: freedRegion.start.row + freedRegion.dimension.rows,
						col: freedRegion.start.col
					},
					dimension: {
						cols: freedRegion.dimension.cols,
						rows: this.size.rows - (freedRegion.start.row + freedRegion.dimension.rows)
					}
				}).filter((region) => !this.doRegionsOverlap(region, targetRegion));

				// Check if the entire column can move up without breaking layout
				const canMoveUp =
					regionsBelow.length > 0 &&
					regionsBelow.every(
						(region) =>
							this.canMoveRegionTo(region, freedRegion.start) &&
							// Moving up shouldn't create overlap with target region
							!this.doRegionsOverlap(
								{
									start: {
										row: region.start.row - freedRegion.dimension.rows,
										col: region.start.col
									},
									dimension: region.dimension
								},
								targetRegion
							)
					);

				if (canMoveUp) {
					const moveUpBy = freedRegion.dimension.rows;
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

	/**
	 * Merges adjacent regions into larger rectangles where possible
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
						region1.dimension.rows === region2.dimension.rows &&
						region1.start.row === region2.start.row &&
						(region1.start.col + region1.dimension.cols === region2.start.col ||
							region2.start.col + region2.dimension.cols === region1.start.col)
					) {
						merged[i] = {
							start: {
								row: region1.start.row,
								col: Math.min(region1.start.col, region2.start.col)
							},
							dimension: {
								rows: region1.dimension.rows,
								cols: region1.dimension.cols + region2.dimension.cols
							}
						};
						merged.splice(j, 1);
						didMerge = true;
						break;
					}

					// Try to merge vertically
					if (
						region1.dimension.cols === region2.dimension.cols &&
						region1.start.col === region2.start.col &&
						(region1.start.row + region1.dimension.rows === region2.start.row ||
							region2.start.row + region2.dimension.rows === region1.start.row)
					) {
						merged[i] = {
							start: {
								row: Math.min(region1.start.row, region2.start.row),
								col: region1.start.col
							},
							dimension: {
								rows: region1.dimension.rows + region2.dimension.rows,
								cols: region1.dimension.cols
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
	 * String representation of the grid, using '-' for empty cells
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
	rows: number;
	cols: number;
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
	cols?: number;
}
