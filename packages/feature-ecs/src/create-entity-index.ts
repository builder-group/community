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
	const maxEid = (1 << entityBits) - 1;
	const entityMask = maxEid;
	const versionMask = ((1 << versionBits) - 1) << entityBits;

	return {
		_config: {
			versioning
		},

		_sparse: [] as number[], // Maps entity ID -> dense array index
		_nextId: 1, // Next entity ID to assign (start from 1)
		dense: [] as number[], // Dense array of entity IDs for iteration
		aliveCount: 0, // Number of currently alive entities

		_versionBits: versionBits,
		_entityBits: entityBits,
		_maxEid: maxEid,
		_entityMask: entityMask,
		_versionMask: versionMask,

		getEid(id: number): number {
			return id & this._entityMask;
		},

		getEidVersion(id: number): number {
			return this._config.versioning
				? (id >>> this._entityBits) & ((1 << this._versionBits) - 1)
				: 0;
		},

		addEntity(): number {
			// Try to recycle a removed entity first
			if (this.aliveCount < this.dense.length) {
				const recycledId = this.dense[this.aliveCount] as number;
				const baseId = this.getEid(recycledId);

				// Restore the sparse mapping and increment alive count
				this._sparse[baseId] = this.aliveCount;
				this.aliveCount++;
				return recycledId;
			}

			// Check if we've reached the maximum number of entities
			if (this._nextId > this._maxEid) {
				throw new Error(`Maximum number of entities exceeded (${this._maxEid})`);
			}

			// Create new entity with version 0
			const baseId = this._nextId++;
			const id = this._createVersionedId(baseId, 0);

			// Add to both dense and sparse arrays
			this.dense.push(id);
			this._sparse[baseId] = this.aliveCount;
			this.aliveCount++;

			return id;
		},

		removeEntity(id: number): boolean {
			const baseId = this.getEid(id);
			const denseIndex = this._sparse[baseId];

			// Check if entity exists and is alive
			if (denseIndex == null || denseIndex >= this.aliveCount || this.dense[denseIndex] !== id) {
				return false;
			}

			const lastIndex = this.aliveCount - 1;

			// Swap-and-pop: move the last alive entity to fill the gap
			if (denseIndex !== lastIndex) {
				const lastId = this.dense[lastIndex] as number;
				const lastBaseId = this.getEid(lastId);

				this.dense[denseIndex] = lastId;
				this._sparse[lastBaseId] = denseIndex;
			}

			// Increment version to invalidate old references and prepare for recycling
			const currentVersion = this.getEidVersion(id);
			const newVersion = this._config.versioning
				? (currentVersion + 1) & ((1 << this._versionBits) - 1)
				: 0;
			const recycledId = this._createVersionedId(baseId, newVersion);

			// Place recycled entity in the "dead" section and clean up
			this.dense[lastIndex] = recycledId;
			delete this._sparse[baseId];
			this.aliveCount--;

			return true;
		},

		isEntityAlive(id: number): boolean {
			const baseId = this.getEid(id);
			const denseIndex = this._sparse[baseId];
			return denseIndex != null && denseIndex < this.aliveCount && this.dense[denseIndex] === id;
		},

		getAliveEntities(): number[] {
			return this.dense.slice(0, this.aliveCount);
		},

		_validate(): boolean {
			// Check that all alive entities have correct sparse mappings
			for (let i = 0; i < this.aliveCount; i++) {
				const eid = this.dense[i] as number;
				const baseId = this.getEid(eid);
				if (this._sparse[baseId] !== i) {
					return false;
				}
			}

			// Check that all entities in sparse array point to valid positions
			for (let baseId = 1; baseId < this._nextId; baseId++) {
				const denseIndex = this._sparse[baseId];
				if (denseIndex != null) {
					// Check bounds
					if (denseIndex >= this.dense.length || denseIndex < 0) {
						return false;
					}

					// Check that the entity at this position has the correct base ID
					const storedId = this.dense[denseIndex] as number;
					if (this.getEid(storedId) !== baseId) {
						return false;
					}
				}
			}

			return true;
		},

		_createVersionedId(baseId: number, version: number): number {
			return this._config.versioning ? baseId | (version << this._entityBits) : baseId;
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

	/** Sparse array mapping entity IDs to their index in the dense array */
	_sparse: number[];
	/** The next entity ID to be assigned */
	_nextId: number;
	/** Dense array of alive entity IDs for efficient iteration */
	dense: number[];
	/** Number of currently alive entities */
	aliveCount: number;

	/** Number of bits reserved for version information */
	_versionBits: number;
	/** Number of bits used for entity ID */
	_entityBits: number;
	/** Maximum entity ID that can be assigned */
	_maxEid: number;
	/** Bit mask for extracting entity ID */
	_entityMask: number;
	/** Bit mask for extracting version */
	_versionMask: number;

	/**
	 * Creates a new entity ID or recycles a previously removed one.
	 * @returns A unique entity ID
	 */
	addEntity(): number;

	/**
	 * Removes an entity from the index, making its ID available for recycling.
	 * If versioning is enabled, increments the version to invalidate stale references.
	 * @param id - The entity ID to remove
	 * @returns True if the entity was removed, false if it wasn't alive
	 */
	removeEntity(id: number): boolean;

	/**
	 * Checks if an entity ID is currently alive.
	 * @param id - The entity ID to check
	 * @returns True if the entity is alive, false otherwise
	 */
	isEntityAlive(id: number): boolean;

	/**
	 * Extracts the base entity ID without version information.
	 * @param id - The potentially versioned entity ID
	 * @returns The base entity ID
	 */
	getEid(id: number): number;

	/**
	 * Extracts the version from an entity ID.
	 * @param id - The entity ID
	 * @returns The version number (0 if versioning is disabled)
	 */
	getEidVersion(id: number): number;

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
	 * @param baseId - The base entity ID
	 * @param version - The version number
	 * @returns The versioned entity ID
	 */
	_createVersionedId(baseId: number, version: number): number;
}
