/**
 * Entity Index for ECS (Entity Component System)
 *
 * Provides efficient entity ID management with optional versioning support.
 * Uses a sparse-dense array pattern for O(1) operations while maintaining
 * cache-friendly dense iteration.
 *
 * Key features:
 * - O(1) entity creation, removal, and alive checks
 * - Memory-efficient ID recycling
 * - Optional versioning to prevent stale entity references
 * - Dense array for cache-friendly iteration
 */

/**
 * Creates a new entity index with the specified configuration.
 *
 * @param options - Configuration options
 * @returns A new entity index instance
 *
 * @example
 * ```typescript
 * // Basic usage without versioning
 * const index = createEntityIndex();
 * const eid = index.addEntity();
 *
 * // With versioning enabled
 * const versionedIndex = createEntityIndex({ versioning: true });
 * ```
 */
export function createEntityIndex(options: TCreateEntityIndexOptions = {}): TEntityIndex {
	const { versioning = false, versionBits = 8 } = options;

	// Validate configuration
	if (versionBits < 1 || versionBits > 16) {
		throw new Error('versionBits must be between 1 and 16');
	}

	// Split 32-bit integer between entity ID and version
	const entityBits = 32 - versionBits;
	const maxBaseEid = (1 << entityBits) - 1;
	const entityMask = maxBaseEid;
	const versionMask = ((1 << versionBits) - 1) << entityBits;

	return {
		_config: {
			versioning
		},

		_sparse: [] as number[],
		_nextBaseEid: 1,
		_dense: [] as number[],
		_aliveCount: 0,

		_versionBits: versionBits,
		_entityBits: entityBits,
		_maxBaseEid: maxBaseEid,
		_entityMask: entityMask,
		_versionMask: versionMask,

		getBaseEid(eid: number): number {
			return eid & this._entityMask;
		},

		getEidVersion(eid: number): number {
			return this._config.versioning
				? (eid >>> this._entityBits) & ((1 << this._versionBits) - 1)
				: 0;
		},

		// Recycling Flow
		// Before:     sparse: [_, 0, _, 1]    dense: [1, 3,   2v1]  aliveCount: 2
		//                                            └─alive─┘└dead┘
		//             addEntity() - Recycling Path ↓
		//
		// Step 1:     Check: 2 < 3 ✓ (dead entities available)
		// Step 2:     Get recycled entity: dense[2] = 2v1, baseEid = 2
		// Step 3:     Restore mapping: _sparse[2] = 2
		// Step 4:     Expand alive section: aliveCount = 3
		//
		// After:      sparse: [_, 0, 2, 1]     dense: [1, 3, 2v1]  aliveCount: 3
		//                                            └──alive───┘
		//             Returns: 2v1 (recycled entity with incremented version)
		//
		//
		// New Entity Flow
		// Before:     sparse: [_, 0, 2, 1]     dense: [1, 3, 2v1]  aliveCount: 3
		//                                            └──alive───┘  nextBaseEid: 4
		//             addEntity() - New Entity Path ↓
		//
		// Step 1:     Check: 3 < 3 ❌ (no dead entities)
		// Step 2:     Check: 4 <= maxBaseEid ✓ (within limits)
		// Step 3:     Create: baseEid = 4, eid = 4v0, _nextBaseEid = 5
		// Step 4:     Add to arrays: push to dense, set sparse mapping
		//
		// After:      sparse: [_, 0, 2, 1, 3]  dense: [1, 3, 2v1, 4]  aliveCount: 4
		//                                            └───alive────┘   nextBaseEid: 5
		//             Returns: 4 (new entity with version 0)
		addEntity(): number {
			// Try to recycle a removed entity first
			if (this._aliveCount < this._dense.length) {
				const recycledEid = this._dense[this._aliveCount] as number;
				const baseEid = this.getBaseEid(recycledEid);

				// Restore the sparse mapping and increment alive count
				this._sparse[baseEid] = this._aliveCount;
				this._aliveCount++;
				return recycledEid;
			}

			// Check if we've reached the maximum number of entities
			if (this._nextBaseEid > this._maxBaseEid) {
				throw new Error(`Maximum number of entities exceeded (${this._maxBaseEid})`);
			}

			// Create new entity with version 0
			const baseEid = this._nextBaseEid++;
			const eid = this._createVersionedEid(baseEid, 0);

			// Add to both dense and sparse arrays
			this._dense.push(eid);
			this._sparse[baseEid] = this._aliveCount;
			this._aliveCount++;

			return eid;
		},

		// Initial:    sparse: [_, 0, 1, 2]    dense: [1, 2, 3]    aliveCount: 3
		//             Remove entity 2 ↓
		//
		// Step 1:     Find entity 2 at index 1
		// Step 2:     Swap entity 3 to index 1
		//             sparse: [_, 0, 1, 1]    dense: [1, 3, 3]    aliveCount: 3
		//
		// Step 3:     Create recycled entity 2v1
		// Step 4:     Place in dead section, clean up sparse
		//             sparse: [_, 0, _, 1]     dense: [1, 3,    2v1]  aliveCount: 2
		//                                            └─alive─┘└dead┘
		//
		// Later:      Recycle entity 2v1
		//             sparse: [_, 0, 2, 1]     dense: [1, 3, 2v1]  aliveCount: 3
		//                                            └──alive───┘
		removeEntity(eid: number): boolean {
			const baseEid = this.getBaseEid(eid);
			const denseIndex = this._sparse[baseEid];

			// Check if entity exists and is alive
			if (denseIndex == null || denseIndex >= this._aliveCount || this._dense[denseIndex] !== eid) {
				return false;
			}

			const lastIndex = this._aliveCount - 1;

			// Swap-and-pop: move the last alive entity to fill the gap
			if (denseIndex !== lastIndex) {
				const lastEid = this._dense[lastIndex] as number;
				const lastBaseEid = this.getBaseEid(lastEid);

				this._dense[denseIndex] = lastEid;
				this._sparse[lastBaseEid] = denseIndex;
			}

			// Increment version to invalidate old references and prepare for recycling
			const currentVersion = this.getEidVersion(eid);
			const newVersion = this._config.versioning
				? (currentVersion + 1) & ((1 << this._versionBits) - 1)
				: 0;
			const recycledEid = this._createVersionedEid(baseEid, newVersion);

			// Place recycled entity in the "dead" section and clean up
			this._dense[lastIndex] = recycledEid;
			delete this._sparse[baseEid];
			this._aliveCount--;

			return true;
		},

		isEntityAlive(eid: number): boolean {
			const baseEid = this.getBaseEid(eid);
			const denseIndex = this._sparse[baseEid];
			return denseIndex != null && denseIndex < this._aliveCount && this._dense[denseIndex] === eid;
		},

		getAliveEntities(): number[] {
			return this._dense.slice(0, this._aliveCount);
		},

		formatEid(eid: number): string {
			const baseEid = this.getBaseEid(eid);
			const version = this.getEidVersion(eid);
			return this._config.versioning ? `${baseEid}v${version}` : `${baseEid}`;
		},

		debugState(): string {
			const aliveEntities = this._dense
				.slice(0, this._aliveCount)
				.map((eid) => this.formatEid(eid));
			const deadEntities = this._dense.slice(this._aliveCount).map((eid) => this.formatEid(eid));

			const sparseEntries = [];
			for (let baseEid = 1; baseEid < this._nextBaseEid; baseEid++) {
				const denseIndex = this._sparse[baseEid];
				if (denseIndex != null) {
					sparseEntries.push(`${baseEid}→${denseIndex}`);
				}
			}

			return [
				`EntityIndex State:`,
				`  Alive (${this._aliveCount}): [${aliveEntities.join(', ')}]`,
				`  Dead (${this._dense.length - this._aliveCount}): [${deadEntities.join(', ')}]`,
				`  Sparse: {${sparseEntries.join(', ')}}`,
				`  NextBaseEid: ${this._nextBaseEid}`,
				`  Versioning: ${this._config.versioning ? 'enabled' : 'disabled'}`
			].join('\n');
		},

		validate(): boolean {
			// Check that all alive entities have correct sparse mappings (Dense -> Sparse)
			for (let i = 0; i < this._aliveCount; i++) {
				const eid = this._dense[i] as number;
				const baseEid = this.getBaseEid(eid);
				if (this._sparse[baseEid] !== i) {
					return false;
				}
			}

			// Check that all entities in sparse array point to valid positions (Sparse -> Dense)
			for (let baseEid = 1; baseEid < this._nextBaseEid; baseEid++) {
				const denseIndex = this._sparse[baseEid];
				if (denseIndex != null) {
					// Check bounds
					if (denseIndex >= this._dense.length || denseIndex < 0) {
						return false;
					}

					// Check that the entity at this position has the correct base ID
					const storedEid = this._dense[denseIndex] as number;
					if (this.getBaseEid(storedEid) !== baseEid) {
						return false;
					}
				}
			}

			return true;
		},

		_createVersionedEid(baseEid: number, version: number): number {
			return this._config.versioning ? baseEid | (version << this._entityBits) : baseEid;
		}
	};
}

/**
 * Configuration options for creating an entity index.
 */
interface TCreateEntityIndexOptions {
	/** Enable versioning to prevent stale entity references. Default: false */
	versioning?: boolean;
	/** Number of bits reserved for version information. Default: 8 (allows 256 versions) */
	versionBits?: number;
}

/**
 * Entity index interface providing efficient entity ID management.
 */
export interface TEntityIndex {
	_config: {
		/** Whether versioning is enabled */
		versioning: boolean;
	};

	/** Sparse array mapping base entity IDs to their index in the dense array */
	_sparse: number[];
	/** The next base entity ID to be assigned */
	_nextBaseEid: number;
	/** Dense array of entity IDs for efficient iteration */
	_dense: number[];
	/** Number of currently alive entities */
	_aliveCount: number;

	/** Number of bits reserved for version information */
	_versionBits: number;
	/** Number of bits used for entity ID */
	_entityBits: number;
	/** Maximum base entity ID that can be assigned */
	_maxBaseEid: number;
	/** Bit mask for extracting entity ID */
	_entityMask: number;
	/** Bit mask for extracting version */
	_versionMask: number;

	/**
	 * Creates a new entity ID or recycles a previously removed one.
	 * @returns A unique entity ID (potentially versioned)
	 */
	addEntity(): number;

	/**
	 * Removes an entity from the index, making its ID available for recycling.
	 * If versioning is enabled, increments the version to invalidate stale references.
	 * @param eid - The entity ID to remove
	 * @returns True if the entity was removed, false if it wasn't alive
	 */
	removeEntity(eid: number): boolean;

	/**
	 * Checks if an entity ID is currently alive.
	 * @param eid - The entity ID to check
	 * @returns True if the entity is alive, false otherwise
	 */
	isEntityAlive(eid: number): boolean;

	/**
	 * Extracts the base entity ID without version information.
	 * @param eid - The potentially versioned entity ID
	 * @returns The base entity ID (without version bits)
	 */
	getBaseEid(eid: number): number;

	/**
	 * Extracts the version from an entity ID.
	 * @param eid - The entity ID
	 * @returns The version number (0 if versioning is disabled)
	 */
	getEidVersion(eid: number): number;

	/**
	 * Gets all alive entity IDs for iteration.
	 * @returns Array of alive entity IDs
	 */
	getAliveEntities(): number[];

	/**
	 * Formats an entity ID as a human-readable string.
	 * @param eid - The entity ID to format
	 * @returns Formatted string like "1v0", "2v3", or just "1" if versioning disabled
	 */
	formatEid(eid: number): string;

	/**
	 * Returns a human-readable debug representation of the entity index state.
	 * Shows alive entities, dead entities, sparse mappings, and configuration.
	 * @returns Multi-line string with formatted state information
	 */
	debugState(): string;

	/**
	 * Validates the internal data structure integrity.
	 * Useful for debugging and testing.
	 * @returns True if the data structure is valid, false otherwise
	 */
	validate(): boolean;

	/**
	 * Creates a versioned entity ID by combining base ID and version.
	 * @param baseEid - The base entity ID
	 * @param version - The version number
	 * @returns The versioned entity ID
	 */
	_createVersionedEid(baseEid: number, version: number): number;
}
