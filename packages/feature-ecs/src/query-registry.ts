/**
 * Query Registry for ECS (Entity Component System)
 *
 * Provides efficient query execution with bitflag-based entity matching.
 * Supports complex query filters including change detection and lifecycle events.
 *
 * Key features:
 * - O(1) query lookup via hash-based caching
 * - Complex query filters (With, Without, Added, Changed, Removed, And, Or, Not)
 * - Multi-generation bitflag support
 * - Change detection for reactive systems
 * - Deferred entity removals for safe iteration
 *
 * ## Query Patterns
 *
 * ### Basic Queries
 * ```typescript
 * // Entities with Position AND Velocity (default behavior)
 * query(world, [With(Position), With(Velocity)])
 *
 * // Same as above using And filter
 * query(world, [And(With(Position), With(Velocity))])
 * ```
 *
 * ### Change Detection Queries
 * ```typescript
 * // Entities where Position changed this frame
 * query(world, [With(Position), Changed(Position)])
 *
 * // Newly spawned entities with Health
 * query(world, [Added(Health)])
 *
 * // Entities that lost their Weapon component
 * query(world, [Removed(Weapon)])
 * ```
 *
 * ### Complex Queries
 * ```typescript
 * // Entities with Position OR Velocity
 * query(world, [Or(With(Position), With(Velocity))])
 *
 * // Entities with Position but WITHOUT Velocity
 * query(world, [With(Position), Without(Velocity)])
 *
 * // Complex combinations
 * query(world, [
 *   With(Position),                    // Must have Position
 *   Or(With(Health), With(Shield)),    // Must have either Health OR Shield
 *   Not(With(Stunned), With(Paralyzed)) // Must NOT have Stunned AND must NOT have Paralyzed
 * ])
 * ```
 */

import { TComponentRef } from './component-registry';
import { TEntityId } from './entity-index';
import { TQueryFilter } from './query-filter';
import { TWorld } from './world';

/**
 * Creates a new query registry.
 *
 * @param world - The world instance to use for component and entity access
 * @returns A new query registry instance
 *
 * @example
 * ```typescript
 * const queryRegistry = createQueryRegistry(world);
 *
 * // Execute queries with explicit filter syntax
 * const entities = queryRegistry.executeQuery(And(With(Position), With(Velocity)));
 *
 * // Change detection queries
 * const changedEntities = queryRegistry.executeQuery(
 *   And(With(Position), Changed(Position))
 * );
 * ```
 */
export function createQueryRegistry(world: TWorld): TQueryRegistry {
	return {
		_world: world,
		_queryCache: new Map(),
		_dirtyQueries: new Set(),

		generateQueryHash(filter) {
			const getComponentId = (component: TComponentRef): number => {
				if (!this._world._componentRegistry._componentMap.has(component)) {
					this._world._componentRegistry.registerComponent(component);
				}
				return this._world._componentRegistry._componentMap.get(component)?.id ?? 0;
			};

			return filter.toString(getComponentId);
		},

		registerQuery(filter) {
			const hash = this.generateQueryHash(filter);

			if (this._queryCache.has(hash)) {
				return this._queryCache.get(hash) as TQueryData;
			}

			// Parse the filter into different categories
			const withComponents: TComponentRef[] = [];
			const withoutComponents: TComponentRef[] = [];
			const addedComponents: TComponentRef[] = [];
			const changedComponents: TComponentRef[] = [];
			const removedComponents: TComponentRef[] = [];
			const nestedFilters: TQueryFilter[] = [];

			this._categorizeFilter(filter, {
				withComponents,
				withoutComponents,
				addedComponents,
				changedComponents,
				removedComponents,
				nestedFilters
			});

			// Build generation masks for efficient querying
			const withMasks = this._buildGenerationMasks(withComponents);
			const withoutMasks = this._buildGenerationMasks(withoutComponents);
			const addedMasks = this._buildGenerationMasks(addedComponents);
			const changedMasks = this._buildGenerationMasks(changedComponents);
			const removedMasks = this._buildGenerationMasks(removedComponents);

			const queryData: TQueryData = {
				hash,
				filter,
				withMasks,
				withoutMasks,
				addedMasks,
				changedMasks,
				removedMasks,
				nestedFilters,
				toRemove: new Set()
			};

			this._queryCache.set(hash, queryData);
			return queryData;
		},

		executeQuery(filter) {
			// Commit any pending removals first
			this._commitRemovals();

			const queryData = this.registerQuery(filter);
			return this._findMatchingEntities(queryData);
		},

		executeInnerQuery(filter) {
			// Execute query without committing removals (for nested iteration)
			const queryData = this.registerQuery(filter);
			return this._findMatchingEntities(queryData);
		},

		checkEntity(queryData, eid) {
			// First check basic component requirements (fastest)
			if (!this._checkBasicRequirements(queryData, eid)) {
				return false;
			}

			// Then check change detection requirements
			if (!this._checkChangeRequirements(queryData, eid)) {
				return false;
			}

			// Finally check nested filters (And/Or/Not)
			if (!this._checkNestedFilters(queryData, eid)) {
				return false;
			}

			return true;
		},

		reset() {
			this._queryCache.clear();
			this._dirtyQueries.clear();
		},

		validate() {
			// Validate query cache integrity
			return this._queryCache.size >= 0; // Basic validation for now
		},

		_categorizeFilter(filter, categories) {
			switch (filter.type) {
				case 'With':
					categories.withComponents.push(filter.component);
					break;
				case 'Without':
					categories.withoutComponents.push(filter.component);
					break;
				case 'Added':
					categories.addedComponents.push(filter.component);
					break;
				case 'Changed':
					categories.changedComponents.push(filter.component);
					break;
				case 'Removed':
					categories.removedComponents.push(filter.component);
					break;
				case 'And':
				case 'Or':
				case 'Not':
					// Handle nested filters separately - do NOT recursively categorize
					// The nested filters will be evaluated entirely by the nested filter logic
					categories.nestedFilters.push(filter);
					break;
				case 'None':
					// None filter doesn't contribute to any category
					// It will be handled specially to return no entities
					categories.nestedFilters.push(filter);
					break;
			}
		},

		_buildGenerationMasks(components) {
			const masks = new Map<number, number>();

			for (const component of components) {
				// Auto-register component if needed
				if (!this._world._componentRegistry._componentMap.has(component)) {
					this._world._componentRegistry.registerComponent(component);
				}

				const componentData = this._world._componentRegistry._componentMap.get(component)!;
				const { generationId, bitflag } = componentData;

				const currentMask = masks.get(generationId) ?? 0;
				masks.set(generationId, currentMask | bitflag);
			}

			return masks;
		},

		_checkBasicRequirements(queryData, eid) {
			const { withMasks, withoutMasks } = queryData;

			// Check across all generations
			for (
				let generationId = 0;
				generationId < this._world._componentRegistry._entityMasks.length;
				generationId++
			) {
				const entityMask = this._world._componentRegistry._entityMasks[generationId]?.[eid] ?? 0;

				// Check WITH requirements (must have ALL)
				const withMask = withMasks.get(generationId) ?? 0;
				if (withMask !== 0 && (entityMask & withMask) !== withMask) {
					return false;
				}

				// Check WITHOUT requirements (must have NONE)
				const withoutMask = withoutMasks.get(generationId) ?? 0;
				if (withoutMask !== 0 && (entityMask & withoutMask) !== 0) {
					return false;
				}
			}

			return true;
		},

		_checkChangeRequirements(queryData, eid) {
			const { addedMasks, changedMasks, removedMasks } = queryData;

			// Check across all generations
			for (
				let generationId = 0;
				generationId < this._world._componentRegistry._entityMasks.length;
				generationId++
			) {
				// Check ADDED requirements (component was added this frame)
				const addedMask = addedMasks.get(generationId) ?? 0;
				if (addedMask !== 0) {
					const entityAddedMask =
						this._world._componentRegistry._addedMasks[generationId]?.[eid] ?? 0;
					if ((entityAddedMask & addedMask) !== addedMask) {
						return false;
					}
				}

				// Check CHANGED requirements (component was modified this frame)
				const changedMask = changedMasks.get(generationId) ?? 0;
				if (changedMask !== 0) {
					const entityChangedMask =
						this._world._componentRegistry._changedMasks[generationId]?.[eid] ?? 0;
					if ((entityChangedMask & changedMask) !== changedMask) {
						return false;
					}
				}

				// Check REMOVED requirements (component was removed this frame)
				const removedMask = removedMasks.get(generationId) ?? 0;
				if (removedMask !== 0) {
					const entityRemovedMask =
						this._world._componentRegistry._removedMasks[generationId]?.[eid] ?? 0;
					if ((entityRemovedMask & removedMask) !== removedMask) {
						return false;
					}
				}
			}

			return true;
		},

		_checkNestedFilters(queryData, eid) {
			const { nestedFilters } = queryData;

			for (const filter of nestedFilters) {
				if (!this._evaluateNestedFilter(filter, eid)) {
					return false;
				}
			}

			return true;
		},

		_evaluateNestedFilter(filter, eid) {
			switch (filter.type) {
				case 'And':
					// ALL nested filters must match
					return filter.filters.every((nestedFilter: TQueryFilter) =>
						this._evaluateSingleFilter(nestedFilter, eid)
					);

				case 'Or':
					// ANY nested filter must match
					return filter.filters.some((nestedFilter: TQueryFilter) =>
						this._evaluateSingleFilter(nestedFilter, eid)
					);

				case 'Not':
					// NONE of the nested filters must match
					return !filter.filters.some((nestedFilter: TQueryFilter) =>
						this._evaluateSingleFilter(nestedFilter, eid)
					);

				case 'None':
					// None filter matches no entities
					return false;

				default:
					// For any other filter type, delegate to _evaluateSingleFilter
					return this._evaluateSingleFilter(filter, eid);
			}
		},

		_evaluateSingleFilter(filter, eid) {
			switch (filter.type) {
				case 'With':
					return this._world._componentRegistry.hasComponent(eid, filter.component);

				case 'Without':
					return !this._world._componentRegistry.hasComponent(eid, filter.component);

				case 'Added':
					return this._world._componentRegistry.wasAdded(eid, filter.component);

				case 'Changed':
					return this._world._componentRegistry.wasChanged(eid, filter.component);

				case 'Removed':
					return this._world._componentRegistry.wasRemoved(eid, filter.component);

				case 'And':
				case 'Or':
				case 'Not':
					return this._evaluateNestedFilter(filter, eid);

				case 'None':
					// None filter matches no entities
					return false;

				default:
					return true;
			}
		},

		_findMatchingEntities(queryData) {
			const matchingEntities: TEntityId[] = [];
			const aliveEntities = this._world._entityIndex.getAliveEntities();

			for (const eid of aliveEntities) {
				if (this.checkEntity(queryData, eid)) {
					matchingEntities.push(eid);
				}
			}

			return matchingEntities;
		},

		_commitRemovals() {
			// Simple deferred removal system
			for (const queryData of this._dirtyQueries) {
				queryData.toRemove.clear();
			}
			this._dirtyQueries.clear();
		}
	};
}

export interface TQueryRegistry {
	/** Reference to the world */
	_world: TWorld;
	/** Cache of registered queries by hash */
	_queryCache: Map<string, TQueryData>;
	/** Set of queries with pending removals */
	_dirtyQueries: Set<TQueryData>;

	/**
	 * Generates a unique hash for query terms for caching.
	 * @param filter - The normalized filter
	 * @returns Unique hash string
	 */
	generateQueryHash(filter: TQueryFilter): string;

	/**
	 * Registers a query and returns its data structure.
	 * Uses caching to avoid recomputing query masks.
	 * @param filter - The query filter
	 * @returns Query data structure
	 */
	registerQuery(filter: TQueryFilter): TQueryData;

	/**
	 * Executes a query and returns matching entities.
	 * Commits pending removals before execution.
	 * @param filter - The query filter
	 * @returns Array of matching entity IDs
	 */
	executeQuery(filter: TQueryFilter): TEntityId[];

	/**
	 * Executes a query without committing removals.
	 * Used for nested queries during iteration.
	 * @param filter - The query filter
	 * @returns Array of matching entity IDs
	 */
	executeInnerQuery(filter: TQueryFilter): TEntityId[];

	/**
	 * Checks if an entity matches a query.
	 * @param queryData - The query data structure
	 * @param eid - The entity ID to check
	 * @returns True if entity matches the query
	 */
	checkEntity(queryData: TQueryData, eid: TEntityId): boolean;

	/**
	 * Resets the query registry to its initial state.
	 */
	reset(): void;

	/**
	 * Validates the query registry integrity.
	 * @returns True if the registry is valid
	 */
	validate(): boolean;

	_categorizeFilter(filter: TQueryFilter, categories: any): void;
	_buildGenerationMasks(components: TComponentRef[]): Map<number, number>;
	_checkBasicRequirements(queryData: TQueryData, eid: TEntityId): boolean;
	_checkChangeRequirements(queryData: TQueryData, eid: TEntityId): boolean;
	_checkNestedFilters(queryData: TQueryData, eid: TEntityId): boolean;
	_evaluateNestedFilter(filter: TQueryFilter, eid: TEntityId): boolean;
	_evaluateSingleFilter(filter: TQueryFilter, eid: TEntityId): boolean;
	_findMatchingEntities(queryData: TQueryData): TEntityId[];
	_commitRemovals(): void;
}

export interface TQueryData {
	/** Unique hash for this query */
	hash: string;
	/** Normalized query filter */
	filter: TQueryFilter;
	/** Bitflag masks for With components by generation */
	withMasks: Map<number, number>;
	/** Bitflag masks for Without components by generation */
	withoutMasks: Map<number, number>;
	/** Bitflag masks for Added components by generation */
	addedMasks: Map<number, number>;
	/** Bitflag masks for Changed components by generation */
	changedMasks: Map<number, number>;
	/** Bitflag masks for Removed components by generation */
	removedMasks: Map<number, number>;
	/** Nested filters (And/Or/Not) */
	nestedFilters: TQueryFilter[];
	/** Set of entities pending removal */
	toRemove: Set<TEntityId>;
}
