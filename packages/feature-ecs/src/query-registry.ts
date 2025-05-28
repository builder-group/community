/**
 * Query Registry for ECS
 *
 * Simple and fast query registry with bitmask optimizations.
 * Follows KISS principle - Keep It Simple, Stupid.
 */

import { TEntityId } from './entity-index';
import { TQueryData, TQueryFilter } from './query-filter';
import { TWorld } from './world';

/**
 * Creates a new query registry
 */
export function createQueryRegistry(world: TWorld): TQueryRegistry {
	return {
		_world: world,
		_queryCache: new Map(),

		executeQuery(filter) {
			const queryData = this.getOrCreateQuery(filter);

			// Return cached result if available and not dirty
			if (!queryData.isDirty && queryData.cachedResult != null) {
				return queryData.cachedResult;
			}

			// Calculate fresh results and cache them
			queryData.cachedResult = this._findMatchingEntities(queryData, filter);
			queryData.isDirty = false;

			return queryData.cachedResult;
		},

		getOrCreateQuery(filter) {
			const hash = filter.getHash(this._world);

			// Return cached query if exists
			if (this._queryCache.has(hash)) {
				return this._queryCache.get(hash)!;
			}

			// Create new query data
			const queryData: TQueryData = {
				hash,
				filter,
				cachedResult: null,
				isDirty: true,
				allComponents: filter.getComponents(),
				withMasks: {},
				withoutMasks: {}
			};

			// Let filter register its bitmasks
			if (filter.register) {
				filter.register(this._world, queryData);
			}

			// Cache the query
			this._queryCache.set(hash, queryData);

			return queryData;
		},

		registerQuery(filter) {
			return this.getOrCreateQuery(filter);
		},

		generateQueryHash(filter) {
			return filter.getHash(this._world);
		},

		checkEntity(queryData, eid) {
			// Use the stored filter's evaluate method with the query data
			return queryData.filter.evaluate(this._world, eid, queryData);
		},

		invalidateQueries() {
			// Mark all queries as dirty
			for (const queryData of this._queryCache.values()) {
				queryData.isDirty = true;
			}
		},

		reset() {
			this._queryCache.clear();
		},

		validate() {
			return this._queryCache.size >= 0;
		},

		_findMatchingEntities(queryData, filter) {
			const matchingEntities: TEntityId[] = [];
			const aliveEntities = this._world._entityIndex.getAliveEntities();

			for (const eid of aliveEntities) {
				if (filter.evaluate(this._world, eid, queryData)) {
					matchingEntities.push(eid);
				}
			}

			return matchingEntities;
		},

		_getFilterFromQueryData(queryData) {
			// Return the stored filter
			return queryData.filter;
		}
	};
}

export interface TQueryRegistry {
	/** Reference to the world */
	_world: TWorld;
	/** Cache of compiled queries by hash */
	_queryCache: Map<string, TQueryData>;

	/**
	 * Executes a query and returns matching entities
	 */
	executeQuery(filter: TQueryFilter): TEntityId[];

	/**
	 * Gets or creates a compiled query
	 */
	getOrCreateQuery(filter: TQueryFilter): TQueryData;

	/**
	 * Registers a query (alias for getOrCreateQuery)
	 */
	registerQuery(filter: TQueryFilter): TQueryData;

	/**
	 * Generates a hash for a query filter
	 */
	generateQueryHash(filter: TQueryFilter): string;

	/**
	 * Checks if an entity matches a query
	 */
	checkEntity(queryData: TQueryData, eid: TEntityId): boolean;

	/**
	 * Invalidates all cached queries
	 */
	invalidateQueries(): void;

	/**
	 * Resets the query registry to its initial state
	 */
	reset(): void;

	/**
	 * Validates the query registry integrity
	 */
	validate(): boolean;

	_findMatchingEntities(queryData: TQueryData, filter: TQueryFilter): TEntityId[];
	_getFilterFromQueryData(queryData: TQueryData): TQueryFilter;
}
