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

		_sparse: [] as number[], // Maps base entity ID -> dense array index
		_nextBaseEid: 1, // Next base entity ID to assign (start from 1)
		dense: [] as number[], // Dense array of entity IDs for iteration
		aliveCount: 0, // Number of currently alive entities

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

		addEntity(): number {
			// Try to recycle a removed entity first
			if (this.aliveCount < this.dense.length) {
				const recycledEid = this.dense[this.aliveCount] as number;
				const baseEid = this.getBaseEid(recycledEid);

				// Restore the sparse mapping and increment alive count
				this._sparse[baseEid] = this.aliveCount;
				this.aliveCount++;
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
			this.dense.push(eid);
			this._sparse[baseEid] = this.aliveCount;
			this.aliveCount++;

			return eid;
		},

		removeEntity(eid: number): boolean {
			const baseEid = this.getBaseEid(eid);
			const denseIndex = this._sparse[baseEid];

			// Check if entity exists and is alive
			if (denseIndex == null || denseIndex >= this.aliveCount || this.dense[denseIndex] !== eid) {
				return false;
			}

			const lastIndex = this.aliveCount - 1;

			// Swap-and-pop: move the last alive entity to fill the gap
			if (denseIndex !== lastIndex) {
				const lastEid = this.dense[lastIndex] as number;
				const lastBaseEid = this.getBaseEid(lastEid);

				this.dense[denseIndex] = lastEid;
				this._sparse[lastBaseEid] = denseIndex;
			}

			// Increment version to invalidate old references and prepare for recycling
			const currentVersion = this.getEidVersion(eid);
			const newVersion = this._config.versioning
				? (currentVersion + 1) & ((1 << this._versionBits) - 1)
				: 0;
			const recycledEid = this._createVersionedEid(baseEid, newVersion);

			// Place recycled entity in the "dead" section and clean up
			this.dense[lastIndex] = recycledEid;
			delete this._sparse[baseEid];
			this.aliveCount--;

			return true;
		},

		isEntityAlive(eid: number): boolean {
			const baseEid = this.getBaseEid(eid);
			const denseIndex = this._sparse[baseEid];
			return denseIndex != null && denseIndex < this.aliveCount && this.dense[denseIndex] === eid;
		},

		getAliveEntities(): number[] {
			return this.dense.slice(0, this.aliveCount);
		},

		_validate(): boolean {
			// Check that all alive entities have correct sparse mappings
			for (let i = 0; i < this.aliveCount; i++) {
				const eid = this.dense[i] as number;
				const baseEid = this.getBaseEid(eid);
				if (this._sparse[baseEid] !== i) {
					return false;
				}
			}

			// Check that all entities in sparse array point to valid positions
			for (let baseEid = 1; baseEid < this._nextBaseEid; baseEid++) {
				const denseIndex = this._sparse[baseEid];
				if (denseIndex != null) {
					// Check bounds
					if (denseIndex >= this.dense.length || denseIndex < 0) {
						return false;
					}

					// Check that the entity at this position has the correct base ID
					const storedEid = this.dense[denseIndex] as number;
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
	dense: number[];
	/** Number of currently alive entities */
	aliveCount: number;

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
	 * Validates the internal data structure integrity.
	 * Useful for debugging and testing.
	 * @returns True if the data structure is valid, false otherwise
	 */
	_validate(): boolean;

	/**
	 * Creates a versioned entity ID by combining base ID and version.
	 * @param baseEid - The base entity ID
	 * @param version - The version number
	 * @returns The versioned entity ID
	 */
	_createVersionedEid(baseEid: number, version: number): number;
}
